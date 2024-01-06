sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, History, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter,
	MessageBox, MessageToast) {
	"use strict";

	var BukrsUser;
	var KostlUser;
	return BaseController.extend("eve.ui.Z_MMASRAF01.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function () {
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oGroupFunctions = {
				Wrbtr: function (oContext) {
					var iNumber = oContext.getProperty('Wrbtr'),
						key, text;
					if (iNumber <= 20) {
						key = "LE20";
						text = this.getResourceBundle().getText("masterGroup1Header1");
					} else {
						key = "GT20";
						text = this.getResourceBundle().getText("masterGroup1Header2");
					}
					return {
						key: key,
						text: text
					};
				}.bind(this)
			};

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().getRoute("RefreshMaster").attachPatternMatched(this._onMasterMatched, this);
			
			this.getRouter().attachBypassed(this.onBypassed, this);
			this.getUser();
			sap.ui.getCore().getEventBus().subscribe("channelName", "eventName", this.onEventTriggered, this);

		},
		_showDetail1 : function () {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
		//	this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				objectId : "",
				bukrs: "",
				masrafyeri: "",
				Statu: "",
			}, bReplace);
		},
		onEventTriggered: function (channel, event, data) {
			// İlgili fonksiyonu burada çağır
			this.onRefresh();

		},
		onCloseCreate1: function () {
			this.createFragM.close();
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("Monat", FilterOperator.EQ, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var item = this._oList.getBinding("items")
			if (item !== undefined) {
				item.refresh();
			}
		},

		/**
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenViewSettings: function (oEvent) {
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "eve.ui.Z_MMASRAF01.view.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog: function (oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aCaptions = [];

			// update filter state:
			// combine the filter array and the filter string
			aFilterItems.forEach(function (oItem) {
				switch (oItem.getKey()) {
				case "W":
					aFilters.push(new Filter("Statu", FilterOperator.EQ, "W"));
					break;
				case "A":
					aFilters.push(new Filter("Statu", FilterOperator.EQ, "A"));
					break;
				case "R":
					aFilters.push(new Filter("Statu", FilterOperator.EQ, "R"));
					break;
				case "U":
					aFilters.push(new Filter("Statu", FilterOperator.EQ, "U"));
					break;
				default:
					break;
				}
				aCaptions.push(oItem.getText());
			});

			this._oListFilterState.aFilter = aFilters;
			this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			//	this._applySortGroup(oEvent);
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			// apply sorter to binding
			// (grouping comes before sorting)
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				var vGroup = this._oGroupFunctions[sPath];
				aSorters.push(new Sorter(sPath, bDescending, vGroup));
			}
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function (oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function (oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_createViewModel: function () {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Expno",
				groupBy: "None"
			});
		},
		getUser: function () {
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();

			sap.ui.core.BusyIndicator.show();

			oDataModel.read("/GetUserSet(Bukrs='" + '' + "')", {
				success: mySuccessHandler,
				error: myErrorHandler
			});

			function mySuccessHandler(data, response) {
				// Yetki = "03";
				BukrsUser = data.Bukrs;
				KostlUser = data.Kostl;

				sap.ui.core.BusyIndicator.hide();
			}

			function myErrorHandler(data, response) {
				sap.m.MessageBox.error("Bir hata oluştu. Lütfen sistem yöneticiniz ile iletişime geçiniz.");
				sap.ui.core.BusyIndicator.hide();
			}
		},

		_onMasterMatched: function (oEvent) {
			this.getModel("appView").setProperty("/layout", "OneColumn");
			// setTimeout(function() {
			// 					this._showDetail1();
			// 					}.bind(this), 2000);
			
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function (oItem) {
			debugger;
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("Requestid"),
				bukrs: oItem.getBindingContext().getProperty("Bukrs"),
				masrafyeri: oItem.getBindingContext().getProperty("Masrafyeri"),
				Statu: oItem.getBindingContext().getProperty("Statu"),
			}, bReplace);
		},
		onSendData1: function () {

			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.removeAllMessages();

			// var oUploadCollection = sap.ui.getCore().byId("fragUpload");
			// if (!oUploadCollection.getItems().length) {
			// 	MessageBox.alert("Doküman girişi zorunludur!");
			// 	return;
			// }

			var that = this;
			var monat = new Date();
			monat.setHours(3, 0, 0);
			monat = monat.getMonth() + 1;
			// var data = this.getModel("detailView").getProperty("/header");
			// data.Tarih.setHours(3, 0, 0);
			var oModel = this.getView().getModel();

			var obj = {
				Requestid: "",
				Bukrs: sap.ui.getCore().byId("idBukrsM").getValue(),
				// Aciklama: data.Aciklama.toUpperCase(),
				// Requestid: "",
				Masrafyeri: sap.ui.getCore().byId("idMasrafYeriM").getValue(),
				// Parabirimi: "TRY",
				// Masrafcesidi: data.Masrafcesidi,
				// Monat: monat.String(),
				// Tutar: data.Tutar,
				// Carikodu: data.Carikodu,
				// Cariadi: data.Cariadi.toUpperCase(),
				Statu: "0"
			};
			if ((obj.Bukrs !== "") && (obj.Masrafyeri !== "")) {
				var msgSuccessTxt = "Belge oluşturmak istediğinize emin misiniz ?";
				MessageBox.warning(
					msgSuccessTxt, {
						id: "warningMessage",
						actions: ["Evet", MessageBox.Action.CANCEL],
						onClose: function (evt) {
							if (evt === "Evet") {
								sap.ui.core.BusyIndicator.show(0);
								oModel.create("/MasterYeniSet", obj, {
									success: function (resp) {

										that.getModel().refresh();
										that.createFragM.close();
										// that.getDocumentDetail(that.Expno);
										// that.masterRefresh();
											that.onRefresh();
										sap.ui.core.BusyIndicator.hide();
									},
									error: function (resp) {
										that.createFragM.close();
										// var messageResp = JSON.parse(resp.responseText);
										// MessageToast.show(messageResp.error.message.value);
										// var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
										// oMessageManager.removeAllMessages();
										// oMessageManager.addMessages(
										// 	new sap.ui.core.message.Message({
										// 		message: messageResp.error.message.value,
										// 		type: sap.ui.core.MessageType.Error,
										// 		processor: oMessageProcessor
										// 	})
										// );
										// sap.ui.core.BusyIndicator.hide();

									}
								});
							}
						}
					}

				);
			} else {
				MessageToast.show("Şirket kodu ve Masraf yeri seçmeden belge oluşturulamaz");
			}
		},
		onCreateMaster: function (oEvent) {
			if (!this.createFragM) {
				this.createFragM = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.BelgeEkle", this);
				this.createFragM.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.createFragM);
			}

			this.createFragM.open();
			if (BukrsUser !== "") {
				sap.ui.getCore().byId("idBukrsM").setValue(BukrsUser);
				sap.ui.getCore().byId("idBukrsM").setEditable(false);
			}
			if (KostlUser !== "") {
				sap.ui.getCore().byId("idMasrafYeriM").setValue(KostlUser);
				sap.ui.getCore().byId("idMasrafYeriM").setEditable(false);
			}
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		}

	});

});