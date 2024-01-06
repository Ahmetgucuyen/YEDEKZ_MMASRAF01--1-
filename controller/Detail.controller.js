sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/core/format/NumberFormat",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/ui/Device"
], function (BaseController, JSONModel, formatter, mobileLibrary, NumberFormat, MessageBox, Filter, Sorter, FilterOperator, MessageToast,
	MessagePopover, MessagePopoverItem, Device) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	var tableData = [];
	var reqid;
	var itemnumber;

	var valueFeed = "";
	var itemno;
	var uniqeGuid;

	var tableDocShow2 = [];
	var tableData2 = [];
	var oView;
	var oTable;
	var bukrs;
	var masrafyeri;
	var Statu;
	var secilenOnayci;
	var Doc = "";
	var filterpar;

	return BaseController.extend("eve.ui.Z_MMASRAF01.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			oView = this.getView();
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				header: {
					Tarih: new Date(),
					Requestid: "",
					Tutar: "0.00",
					Aciklama: "",
					Masrafyeri: "",
					Masrafcesidi: "",
					Carikodu: "",
					Cariadi: ""
				}
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			// this.onReqid();
			// this._filterDetail(filterpar);
			// this._filterGecmis(this.Expno);
		},
			GetMaxItem: function () {
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();

			sap.ui.core.BusyIndicator.show();

			oDataModel.read("/getMaxItemSet(Reqid='" + this.Expno + "')", {
				success: mySuccessHandler,
				error: myErrorHandler
			});

			function mySuccessHandler(data, response) {
				// Yetki = "03";
				itemno = data.Eitemno;
			
				sap.ui.core.BusyIndicator.hide();
			}

			function myErrorHandler(data, response) {
				sap.m.MessageBox.error("Bir hata oluştu. Lütfen sistem yöneticiniz ile iletişime geçiniz.");
				sap.ui.core.BusyIndicator.hide();
			}
		},
		_filterGecmis: function (systemUnamedeneme) {

			var oTable = this.getView().byId("idGecmisLog");
			var oBinding = oTable.getBinding("items");
			oBinding.filter([new sap.ui.model.Filter("Requestid", sap.ui.model.FilterOperator.EQ, systemUnamedeneme)]);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
	

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
			onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},
		onClose2: function () {
			this.dosya.close()
		},
		onActionPressedDR: function (oEvent) {
			var item = oEvent.getSource();
			var sAction = item.getCustomData()[0].getValue();
			var sServiceURL = this.getView().getModel().sServiceUrl;
			URLHelper.redirect(sAction, true);
			// window.open(sAction, "_blank");
		},
		_filterDetail: function (filterpar) {
			var oTable = this.getView().byId("lineItemsList");
			var oBinding = oTable.getBinding("items");
			oBinding.filter([new sap.ui.model.Filter("Requestid", sap.ui.model.FilterOperator.EQ, filterpar)]);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var that = this;
			var bkrs = oEvent.getParameter("arguments").bukrs;

			var my = oEvent.getParameter("arguments").masrafyeri;
			var stat = oEvent.getParameter("arguments").Statu;
			bukrs = bkrs;
			Statu = stat;
			masrafyeri = my;
			this.Expno = sObjectId;
			filterpar = sObjectId;

			//	this.getOwnerComponent().getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getOwnerComponent().getModel().createKey("MasterYeniSet", {
					Requestid: sObjectId
				});
				setTimeout(function () {

					that._bindView("/" + sObjectPath);
				}, 500);
			}.bind(this));

			this.getDocumentDetail(sObjectId);
		},

		getDocumentDetail: function (Requestid) {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();
			var filters = [];
			var sFilter = new sap.ui.model.Filter("Requestid", sap.ui.model.FilterOperator.EQ, Requestid);
			var s1Filter = new sap.ui.model.Filter("Statu", sap.ui.model.FilterOperator.EQ, Statu);
			filters.push(sFilter);
			filters.push(s1Filter);

			oDataModel.read("/DetailSet", {
				success: mySuccessHandler,
				filters: filters,
				error: myErrorHandler
			});

			function mySuccessHandler(data, response) {
				if (data.results.length > 0) {
					// that.byId("onayaGonder").setVisible(true);
				} else {
					// that.byId("onayaGonder").setVisible(false);
				}
				if (Statu !== "0") {
					that.byId("idonay").setVisible(false);

					that.byId("idekle").setVisible(false);

					that.byId("lineItemsListGecmis").setMode("None");
				} else if (Statu === "0") {

					that.byId("idekle").setVisible(true);
					that.byId("idonay").setVisible(true);

					that.byId("lineItemsListGecmis").setMode("Delete");
				}
				tableData = data.results;
				that.getDocumentGecmis(that.Requestid);
				var oTable = that.getView().byId("idGecmisLog");

				var oBinding = oTable.getBinding("items");
				if (oBinding !== undefined) {
					oBinding.filter([new sap.ui.model.Filter("Requestid", sap.ui.model.FilterOperator.EQ, that.Expno)]);
					oBinding.refresh(true);
				}

				sap.ui.getCore().getEventBus().publish("channelName", "eventName", {});
				// tableData2 = data.results;

				// var oViewModel = new JSONModel({
				// tableData: tableData,
				// tableData2: tableData2
				// });

				// oView.setModel(oViewModel, "docDetailModel");
				sap.ui.core.BusyIndicator.hide();
				sap.ui.core.BusyIndicator.hide();
			}

			function myErrorHandler(response) {
				sap.m.MessageBox.error("Bir hata oluştu. Lütfen sistem yöneticinizle iletişime geçiniz.");
				sap.ui.core.BusyIndicator.hide();
			}
		},

		getDocumentGecmis: function (Requestid) {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();
			var filters = [];
			var sFilter = new sap.ui.model.Filter("Requestid", sap.ui.model.FilterOperator.EQ, Requestid);
			var s1Filter = new sap.ui.model.Filter("Statu", sap.ui.model.FilterOperator.EQ, Statu);
			filters.push(s1Filter);
			filters.push(sFilter);

			oDataModel.read("/DetailSet", {
				success: mySuccessHandler,
				filters: filters,
				error: myErrorHandler
			});

			function mySuccessHandler(data, response) {
				tableData2 = data.results;

				var oViewModel = new JSONModel({
					tableData: tableData,
					tableData2: tableData2
				});

				oView.setModel(oViewModel, "docDetailModel");
				sap.ui.core.BusyIndicator.hide();
			}

			function myErrorHandler(response) {
				sap.m.MessageBox.error("Bir hata oluştu. Lütfen sistem yöneticinizle iletişime geçiniz.");
				sap.ui.core.BusyIndicator.hide();
			}
		},

		onShowAciklama: function (oEvent) {

			this.getModel("detailView").setProperty("/Aciklama", oEvent.getSource().getBindingContext("docDetailModel").getObject().Aciklama);

			if (!this.aciklamaFrag) {
				this.aciklamaFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.Aciklama", this);
				this.aciklamaFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.aciklamaFrag);
			}

			this.aciklamaFrag.open();

		},
		onShowRed: function (oEvent) {

			this.getModel("detailView").setProperty("/Red", oEvent.getSource().getBindingContext().getObject().Red);

			if (!this.redFrag) {
				this.redFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.Red", this);
				this.redFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.redFrag);
			}

			this.redFrag.open();

		},
		onShowRedNedeni: function (oEvent) {

			this.getModel("detailView").setProperty("/RedNedeni", oEvent.getSource().getBindingContext("docDetailModel").getObject().RedNedeni);

			if (!this.redNedeniFrag) {
				this.redNedeniFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.RedNedeni", this);
				this.redNedeniFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.redNedeniFrag);
			}

			this.redNedeniFrag.open();

		},

		onPressAddSatir: function (oEvent) {

this.GetMaxItem();
			var that = this;
			that.RandomGuid();
			if (!this.createFrag) {
				this.createFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.MasrafEkle", this);
				this.createFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.createFrag);
			}

			this.createFrag.open();
		},
		onCloseCreate: function () {
			this.createFrag.close();
		},
		onCloseDialogRedNedeni: function () {
			this.redNedeniFrag.close();
		},
		onCloseDialogAckl: function () {
			this.aciklamaFrag.close();
		},
		onCloseDialogRed: function () {
			this.redFrag.close();
		},
		onDeleteItem: function (oEvent) {
			if ((oEvent.getParameter("listItem").getBindingContext("docDetailModel").getObject().Statu == '0')) {
				var charValue = oEvent.getParameter("listItem").getBindingContext("docDetailModel").getObject().Itemno;
				var key = parseInt(charValue, 10);
				var Expno = oEvent.getParameter("listItem").getBindingContext("docDetailModel").getObject().Expno;
				var sPath = "/DetailSet(Requestid='" + oEvent.getParameter("listItem").getBindingContext("docDetailModel").getObject().Requestid +
					"',Itemno='" +
					charValue + "')",
					oModel = this.getView().getModel(),
					that = this,
					msgSuccessTxt = this.getResourceBundle().getText("msgDelTxt");
				MessageBox.warning(
					msgSuccessTxt, {
						id: "warningMessage",
						actions: ["Evet", MessageBox.Action.CANCEL],
						onClose: function (evt) {
							if (evt === "Evet") {
								sap.ui.core.BusyIndicator.show(0);
								oModel.remove(sPath, {
									success: function () {
										that.getModel().refresh();

										// that.createFrag.close();
										that.getDocumentDetail(that.Expno);
										that.masterRefresh();
										sap.ui.core.BusyIndicator.hide();
										// that.getDocumentDetail(Expno);
										// that.masterRefresh();
										// sap.ui.core.BusyIndicator.hide();
									},
									error: function () {
										that.getModel().refresh();
										sap.ui.core.BusyIndicator.hide();
									}
								});
							}
						}
					}
				);
			} else {
				sap.m.MessageBox.warning("Sadece onaya gönderilmemiş kayıtlar silinebilir!");
			}
		},
		onSendData: function () {
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.removeAllMessages();

			var oUploadCollection = sap.ui.getCore().byId("fragUpload");
			// if (!oUploadCollection.getItems().length) {
			// 	MessageBox.alert("Doküman girişi zorunludur!");
			// 	return;
			// }

			var that = this;
			var data = this.getModel("detailView").getProperty("/header");
			data.Tarih.setHours(3, 0, 0);
			var oModel = this.getView().getModel();

			var obj = {
				Requestid: this.Expno,
				Bukrs: bukrs,
				Aciklama: data.Aciklama.toUpperCase(),
				// Requestid: "",
				Masrafyeri: masrafyeri,
				// Parabirimi: "TRY",
				Masrafcesidi: data.Masrafcesidi,
				Carikodu: data.Carikodu,
				Tutar: data.Tutar,
				Cariadi: data.Cariadi,
				Datum: data.Tarih,
				// Monat: data.Tarih.slice(8),
				// Carikodu: data.Carikodu,
				// Cariadi: data.Cariadi.toUpperCase(),
				Statu: "0"
			};
			if ((obj.Masrafcesidi !== "") && (obj.Carikodu !== "") && (obj.Tutar !== "") && (obj.Cariadi !== "")) {
				var msgSuccessTxt = this.getResourceBundle().getText("msgCreateTxt");
				MessageBox.warning(
					msgSuccessTxt, {
						id: "warningMessage",
						actions: ["Evet", MessageBox.Action.CANCEL],
						onClose: function (evt) {
							if (evt === "Evet") {
								sap.ui.core.BusyIndicator.show(0);
								oModel.create("/DetailSet", obj, {
									success: function () {

										// var url = "/sap/opu/odata/sap/ZMERKEZ_MASRAF_SRV/FileUploadDocSet(Expno='" + resp.Expno + "',Itemno='" + resp.Itemno +
										// 	"')/UPLOADNP";
										/*that.oUploadCollection.setUploadUrl(url);*/

										// that.Expno = resp.Expno;
										// that.Itemno = resp.Itemno;

										// for (var i = 0; i < that.oUploadCollection._aFileUploadersForPendingUpload.length; i++) {
										// 	that.oUploadCollection._aFileUploadersForPendingUpload[i].setUploadUrl(url);
										// }
										// that.oUploadCollection.upload();

										that.getModel().refresh();

			sap.ui.getCore().byId("fragUpload").destroyItems();
										sap.ui.getCore().byId("idMasrafTuru").setValue("");
										sap.ui.getCore().byId("idTutar").setValue("0,00");
										sap.ui.getCore().byId("idCariAdi").setValue("");
										sap.ui.getCore().byId("idCariKod").setValue("");
										sap.ui.getCore().byId("idNote").setValue("");
										that.createFrag.close();
										that.getDocumentDetail(that.Expno);
										that.masterRefresh();
										sap.ui.core.BusyIndicator.hide();

									},
									error: function (resp) {
										// that.createFrag.close();
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
										sap.ui.core.BusyIndicator.hide();

									}
								});
							}
						}
					}
				);
			} else {
				MessageToast.show("Zorunlu alanlar doldurulmadan masraf oluşturulamaz");
			}
		},

		onDown: function () {
			sap.m.URLHelper.redirect(this.getModel().sServiceUrl + "/DocDownloadSet(Expno='" + this.Expno + "',Itemno='" + "000" + "',Docid='" +
				"00" + "')/$value", true);
		},

		onUp: function () {
			if (!this.MasrafFormuFrag) {
				this.MasrafFormuFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.MasrafFormUpload", this);
				this.MasrafFormuFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.MasrafFormuFrag);
			}
			this.MasrafFormuFrag.open();
		},
		onCloseDocDialogMasrafFormu: function () {
			this.MasrafFormuFrag.close();
		},
		onChange1: function (e) {
			var t = e.getSource();
			var i = this.getView().getModel().oHeaders["x-csrf-token"];
			var s = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: i
			});
			t.addHeaderParameter(s);
			var a = "/sap/opu/odata/sap/ZMERKEZ_MASRAF_SRV/FileUploadDocSet(Expno='" + this.getView().getBindingContext().getObject().Expno +
				"',Itemno='" + "000" + "')/UPLOADNP";
			t.setUploadUrl(a);
		},
		onBeforeUploadStarts1: function (e) {
			var t = this.slugify(e.getParameter("fileName"));
			var i = new sap.ui.unified.FileUploaderParameter({
				name: "slug",
				value: t
			});
			e.getParameters().addHeaderParameter(i);
			e.getParameters().addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
				name: "X-Requested-With",
				value: "XMLHttpRequest"
			}));
		},
		onUploadComplete1: function (e) {

			var t = sap.ui.getCore().getMessageManager(),
				i = new sap.ui.core.message.ControlMessageProcessor;

			//Status 201 kontrol et

			/*t.addMessages(new sap.ui.core.message.Message({
				message: this.getResourceBundle().getText("UPLSUCCESS"),
				type: sap.ui.core.MessageType.Success,
				processor: i
			}));

			this.MasrafFormuFrag.close();*/

			var parseXml;
			if (window.DOMParser) {
				parseXml = function (xmlStr) {
					return (new window.DOMParser()).parseFromString(xmlStr, "text/xml");
				};
			} else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
				parseXml = function (xmlStr) {
					var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async = "false";
					xmlDoc.loadXML(xmlStr);
					return xmlDoc;
				};
			} else {
				parseXml = function () {
					return null;
				};
			}
			var xmlDoc = parseXml(e.getParameter("mParameters").responseRaw);

			function xmlToJson(xml) {
				// Create the return object
				var obj = {};
				// console.log(xml.nodeType, xml.nodeName );
				if (xml.nodeType == 1) { // element
					// do attributes
					if (xml.attributes.length > 0) {
						obj["@attributes"] = {};
						for (var j = 0; j < xml.attributes.length; j++) {
							var attribute = xml.attributes.item(j);
							obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
						}
					}
				} else if (xml.nodeType == 3 ||
					xml.nodeType == 4) { // text and cdata section
					obj = xml.nodeValue;
				}
				// do children
				if (xml.hasChildNodes()) {
					for (var i = 0; i < xml.childNodes.length; i++) {
						var item = xml.childNodes.item(i);
						var nodeName = item.nodeName;
						if (typeof (obj[nodeName]) == "undefined") {
							obj[nodeName] = xmlToJson(item);
						} else {
							if (typeof (obj[nodeName].length) == "undefined") {
								var old = obj[nodeName];
								obj[nodeName] = [];
								obj[nodeName].push(old);
							}
							if (typeof (obj[nodeName]) === 'object') {
								obj[nodeName].push(xmlToJson(item));
							}
						}
					}
				}
				return obj;
			}
			var theJson = xmlToJson(xmlDoc);
			var msgDet = theJson.error.innererror.errordetails.errordetail.message["#text"];
			/*var bapiretArr = [];
			for (var i = 0; i < msgDet.length; i++) {
				var txt = theJson.error.innererror.errordetails.errordetail[i].message["#text"];
				if (theJson.error.innererror.errordetails.errordetail[i].severity["#text"] === "error") {
					var type = "E";
				}
				var bapiretObj = {};
				bapiretObj.Message = txt;
				bapiretObj.Type = type;
				bapiretArr.push(bapiretObj);
			}
			if (bapiretArr.length) {
				//Hataları yazdır
			} else {
				//Hata yok ise
			}*/

			this.MasrafFormuFrag.close();

			// o.information(msgDet);
			MessageToast.show(msgDet);
			if (msgDet != "Günde iki kere döküman yükleme yapılamaz!") {
				Doc = "X";
			}

			this.setDocButtons();

			/*t.addMessages(new sap.ui.core.message.Message({
				message: msg,
				type: sap.ui.core.MessageType.Information,
				processor: i
			}));*/

		},
		onReqid: function (oEvent) {
			var that = this;

			var oModel = this.getOwnerComponent().getModel();
			sap.ui.core.BusyIndicator.show();
			oModel.read("/GetReqidSet(EvReqid='1')", {
				// filters: aFilter,
				method: "GET",
				success: function (data) {

					reqid = data.EvReqid;

					sap.ui.core.BusyIndicator.hide();
				},
				error: function (e) {
					alert("error");

					sap.ui.core.BusyIndicator.hide();
				}
			});
			// that.RandomGuid();
			// that.onDosyaYukle();

		},
		onChangeCari: function () {
			var that = this;
			var cariadi;
			var carikodu = sap.ui.getCore().byId("idCariKod").getValue();
			var oModel = this.getOwnerComponent().getModel();
			sap.ui.core.BusyIndicator.show();
			oModel.read("/CariGetirSet(Carikodu='" + carikodu + "')", {
				// filters: aFilter,
				method: "GET",
				success: function (data) {

					cariadi = data.Cariadi;
					sap.ui.getCore().byId("idCariAdi").setValue(cariadi);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (e) {
					alert("error");

					sap.ui.core.BusyIndicator.hide();
				}
			});
			// that.RandomGuid();
			// that.onDosyaYukle();

		},

		setDocButtons: function () {
			if (Doc == "X") {
				this.byId("idFormDownBtn").setVisible(true);
				this.byId("idFormUpBtn").setVisible(true);
			} else {
				this.byId("idFormDownBtn").setVisible(true);
				this.byId("idFormUpBtn").setVisible(true);
			}

			if ((this.byId("idStatuAttr").getTitle() == "D") || (this.byId("idStatuAttr").getTitle() == "C") || (this.byId("idStatuAttr").getTitle() ==
					"F") || (this.byId("idStatuAttr").getTitle() ==
					"B")) {
				// this.byId("idFormDownBtn").setVisible(false);
				this.byId("idFormUpBtn").setVisible(false);
				// this.byId("onayaGonder").setVisible(false);
			} else {
				// this.byId("onayaGonder").setVisible(true);
			}

		},

		onApp: function () {

			// if (Doc == "X") {
			sap.ui.core.BusyIndicator.show();
			secilenOnayci = "";
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();

			if (!this.onayciFrag) {
				this.onayciFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.Onayci", this);
				this.onayciFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.onayciFrag);
			}

			oDataModel.read("/OnaycilarSet", {
				success: mySuccessHandler,
				error: myErrorHandler
			});

			function mySuccessHandler(data, response) {
				if (data.results.length > 1) {
					that.onayciFrag.open();
					var Onaycilar = data.results;
					var oViewModel = new JSONModel({
						Onaycilar: Onaycilar
					});

					oView.setModel(oViewModel, "onayDialogModel");
				} else {
					secilenOnayci = data.results[0].PernrOnay;
					that.onChooseOnayci();
				}

				sap.ui.core.BusyIndicator.hide();
			}

			function myErrorHandler(response) {
				sap.m.MessageBox.error("Bir hata oluştu. Lütfen sistem yöneticinizle iletişime geçiniz.");
				sap.ui.core.BusyIndicator.hide();
			}
			// } else {
			// 	sap.m.MessageBox.warning("Masraf formu yüklemeden onay verilemez.");
			// }

		},

		onOnayciSelection: function (oEvent) {
			secilenOnayci = oEvent.getParameter("listItem").getBindingContext("onayDialogModel").getProperty("PernrOnay");
		},

		onChooseOnayci: function () {

			sap.ui.core.BusyIndicator.show();
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();
			var filters = [];
			filters.push(new sap.ui.model.Filter("IExpno", sap.ui.model.FilterOperator.EQ, this.Expno));
			filters.push(new sap.ui.model.Filter("IUname", sap.ui.model.FilterOperator.EQ, secilenOnayci));
			filters.push(new sap.ui.model.Filter("IRed", sap.ui.model.FilterOperator.EQ, ""));
			filters.push(new sap.ui.model.Filter("IStatu", sap.ui.model.FilterOperator.EQ, "D"));

			oDataModel.read("/OnayaGonderSet", {
				success: mySuccessHandler,
				filters: filters,
				error: myErrorHandler
			});

			function mySuccessHandler(data, response) {
				if (data.results.length == 0) {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.success("Kayıt başarılı bir şekilde onaya gönderilmiştir.");
					that.getDocumentDetail(that.Expno);
					that.masterRefresh();
				} else {
					sap.m.MessageBox.warning(data.results[0].Message);
					sap.ui.core.BusyIndicator.hide();
				}
				that.onCloseDialogOnayci();
			}

			function myErrorHandler(response) {
				sap.m.MessageBox.error("Bir hata oluştu. Lütfen sistem yöneticinizle iletişime geçiniz.");
				sap.ui.core.BusyIndicator.hide();
			}

		},

		onCloseDialogOnayci: function () {
			this.onayciFrag.close();
		},

		onShowDoc: function (oEvent) {

			var url = this.getModel().sServiceUrl,
				ExpnoStr = "/DocDownloadSet(Expno='",
				ItemnoStr = "',Itemno='",
				DocidStr = "',Docid='",
				value = "')/$value";
			this.getModel("detailView").setProperty("/url", url);

			this.getModel("detailView").setProperty("/ExpnoStr", ExpnoStr);
			this.getModel("detailView").setProperty("/ItemnoStr", ItemnoStr);
			this.getModel("detailView").setProperty("/DocidStr", DocidStr);
			this.getModel("detailView").setProperty("/value", value);
			sap.ui.core.BusyIndicator.show(0);

			if (!this.DocListFrag) {
				this.DocListFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.DocList", this);
				this.DocListFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.DocListFrag);
			}

			/*	Expno
				Itemno*/

			var filter = [];
			filter.push(new Filter("Expno", FilterOperator.EQ, oEvent.getSource().getBindingContext("docDetailModel").getObject().Expno));
			filter.push(new Filter("Itemno", FilterOperator.EQ, oEvent.getSource().getBindingContext("docDetailModel").getObject().Itemno));

			this.Expno = oEvent.getSource().getBindingContext("docDetailModel").getObject().Expno;
			this.Itemno = oEvent.getSource().getBindingContext("docDetailModel").getObject().Itemno;
			var that = this;
			var oModel = this.getView().getModel();
			oModel.read("/DocListSet", {
				filters: filter,
				success: function (resp) {
					that.getModel("detailView").setProperty("/DocListItems", resp.results);
					that.DocListFrag.open();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {}
			});

		},
		onReadDoc: function (oEvent) {

			var url = this.getModel().sServiceUrl;
			this.getModel("detailView").setProperty("/url", url);

			if (!this.DocListFrag) {
				this.DocListFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.DocList", this);
				this.DocListFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.DocListFrag);
			}

			/*	Expno
				Itemno*/

			var filter = [];
			filter.push(new Filter("Expno", FilterOperator.EQ, this.Expno));
			filter.push(new Filter("Itemno", FilterOperator.EQ, this.Itemno));

			var that = this;
			var oModel = this.getView().getModel();
			oModel.read("/DocListSet", {
				filters: filter,
				success: function (resp) {
					that.getModel("detailView").setProperty("/DocListItems", resp.results);
					that.getView().getModel("detailView").setProperty("/screenOptions/busyUploadCollect", false);

				},
				error: function () {}
			});

		},
		onSelectionChange: function (oEvent) {
			oTable = oEvent.getSource();

		},

		onPressOnayla: function (oEvent) {
			var oModel = this.getView().getModel();
			var oEntry = {};
			oEntry.Statu = "1";
			var that = this;
			oModel.update("/MasterYeniSet(Requestid='" + this.Expno + "')", oEntry, {
				method: "POST",
				success: function (data) {
					MessageToast.show("Onaya Gönderildi");
					that.byId("idonay").setVisible(false);
					that.byId("idekle").setVisible(false);
					sap.ui.getCore().getEventBus().publish("channelName", "eventName", {});
					var oTable = that.getView().byId("idGecmisLog");
					var oBinding = oTable.getBinding("items");
					oBinding.filter([new sap.ui.model.Filter("Requestid", sap.ui.model.FilterOperator.EQ, that.Expno)]);
				},
				error: function (e) {
					alert("error");
				},
			});
		},
		onPressReddet: function (oEvent) {

			/*create operation*/
			// var flag;
			// var buton = this.getView().byId("idOnaylaKanal");
			// buton.setEnabled(false);
			// var buton = this.getView().byId("idReddet").getEnabled(false);
			// setTimeout(function () {
			//     buton.setEnabled(true);
			//   }, 5000);
			var oModel = this.getView().getModel();
			var oEntry = {};
			oEntry.Statu = "1";
			// oEntry.Onaydurum = "X" ;
			// oEntry.Onayci = systemUnamedeneme;
			// var oTable = this.getView().byId("idProductsTableKanal");
			// var oBinding = oTable.getBinding("items");
			var that = this;
			// var Musterino = oEvent.getSource().getBindingContext().getObject().Musterino;

			// if(flag === 0){
			// flag = 1;

			oModel.update("/MasterYeniSet(Requestid='" + this.Expno + "')", oEntry, {
				method: "POST",
				success: function (data) {
					// if(data.Statu !== "Y"){
					// 	var mesaj = data.Message;
					// if(mesaj ===""){

					MessageToast.show("Onaya Gönderildi");
					// }
					// else{

					// 	alert(mesaj);

					// }

					// }else if (data.Statu === "Y"){
					// 	var carinumber = data.Object_id;
					// 	alert(carinumber + " numaralı cari yaratıldı");

					// that.onPressDosyaFinal(FormnoOnay);
					// }
					// oBinding.refresh(true);
					// flag = 0;
				},
				error: function (e) {
					alert("error");
					// flag = 0;
				},
			});

			// }
		},

		onTamamla: function () {
			var oEntry = {};
			var aSelectedItems = oTable.getSelectedItems();
			var selectedItems1 = [];

			// aSelectedItems dizisi seçilen satırları içerir
			for (var i = 0; i < aSelectedItems.length; i++) {
				var oSelectedItem = aSelectedItems[i];
				var oBindingContext = oSelectedItem.getBindingContext("docDetailModel");
				var oSelectedData = oBindingContext.getObject();

				var selectedDataMatnr = {
					Requestid: oSelectedData.Requestid,
					Bukrs: oSelectedData.Bukrs
						// Fark: oSelectedData.Fark
				};

				selectedItems1.push(selectedDataMatnr);
			}

			// SmartTable elemanını al
			// var smartTable = this.getView().byId(smartTableId);

			// Table elemanını al
			// var table = this.getView().byId(tableId);

			// Seçilen satırları al
			// var selectedIndices = table.getSelectedIndices();

			// selectedIndices.forEach(function (index) {
			// 	var context = table.getContextByIndex(index);
			// 	var selectedData = context.getObject();
			// 	// if ((!selectedData.Fark.startsWith("0.00"))&&(!selectedData.Fark.startsWith("-"))) {

			// 	if ((!selectedData.Fark.startsWith("0.00"))) {
			// 		var selectedDataMatnr = {
			// 			Matnr: selectedData.Matnr,
			// 			SayimId: selectedData.SayimId,
			// 			Fark: selectedData.Fark
			// 		};
			// 		var rapormatnr = {
			// 			Matnr: selectedData.Matnr,
			// 			Mesaj: ""
			// 		};
			// 		// selectedDataMatnr.Matnr = selectedData.Matnr
			// 		// selectedDataMatnr.SayimId = selectedData.SayimId
			// 		// selectedDataMatnr.Fark = selectedData.Fark
			// 		selectedItems1.push(selectedDataMatnr);
			// 		rapor.push(rapormatnr);
			// 	}
			// });

			// oEntry.R = sayimId;
			oEntry.NAVISDATA = selectedItems1;
			oEntry.NAVRETURN = [{
				"Id": "",
				"Number": "",
				"Message": "",
				"Type": ""
			}];
			// console.log("Seçilen Satırlar:", selectedItems);

			var oModel = this.getOwnerComponent().getModel();

			sap.ui.core.BusyIndicator.show();
			var that = this;
			oModel.create("/OnayCreateDeepSet", oEntry, {

				success: function (data) {
					// var mesaj = data.NAVTALEPRETURN.results[1].Message;
					// MessageBox.information(mesaj);
					var length = data.NAVTALEPRETURN.results.length;
					for (var i = 1; i < length; i++) {
						rapor[i - 1].Mesaj = data.NAVTALEPRETURN.results[i].Message
					}
					var message = "";

					rapor.forEach(function (item) {
						if (item.Mesaj !== "") {
							message += item.Matnr + " kodlu malzeme için " + item.Mesaj + "\n\n";
						}
					});
					if (message !== "") {
						MessageBox.information(message);

					} else {

						sap.ui.core.BusyIndicator.hide();
						MessageToast.show("Fark kaydı işlendi");
						that.onFark();
						// that._tamamla2();
					}
					that.getView().byId("LineItemsSmartTable").rebindTable();

				},
				error: function (e) {
					// var mesaj = e.Message;
					alert("error");
					sap.ui.core.BusyIndicator.hide();
				},
			});

		},

		onCloseDocDialogDocList: function () {
			this.DocListFrag.close();
		},
		slugify: function (text) {
			var trMap = {
				"çÇ": "c",
				"ğĞ": "g",
				"şŞ": "s",
				"üÜ": "u",
				"ıİ": "i",
				"öÖ": "o"
			};
			for (var key in trMap) {
				text = text.replace(new RegExp('[' + key + ']', 'g'), trMap[key]);
			}
			return text;
		},
		RandomGuid: function () {
			uniqeGuid = Math.floor((Math.random()) * 0x10000).toString(16);
		},
		onChange: function (oEvent) {

			var t = oEvent.getSource();
			// ttt = t;
			var i = this.getView().getModel().oHeaders["x-csrf-token"];

			var s = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: i
			});
			t.addHeaderParameter(s);

			var s2 = new sap.m.UploadCollectionParameter({
				name: "X-Requested-With",
				value: "XMLHttpRequest"
			});
			t.addHeaderParameter(s2);
			var uniqeFormno = this.Expno;
			var url = "/sap/opu/odata/sap/ZYEGE_01_SRV/FileSet(IvGuid='" + uniqeGuid + "',IvItemno='" + itemno + "',IvFormno='" + uniqeFormno + "')/FILENP";

			// urlll = url;
			t.setUploadUrl(url);
			// 	var uniqeFormno2 = MaxFormNo2tik;
			// 	var url2 = "/sap/opu/odata/sap/ZDZY_OD_BP_SRV_SRV/FileSet(IvGuid='" + uniqeGuid + "',IvFormno='" + uniqeFormno2 + "')/FILENP";

			// 	var t2 = oEvent.getSource();
			// 	// ttt = t;
			// 	var i2 = this.getView().getModel().oHeaders["x-csrf-token"];

			// 	var s3 = new sap.m.UploadCollectionParameter({
			// 		name: "x-csrf-token",
			// 		value: i
			// 	});
			// 	t2.addHeaderParameter(s3);

			// 	var s4 = new sap.m.UploadCollectionParameter({
			// 		name: "X-Requested-With",
			// 		value: "XMLHttpRequest"
			// 	});
			// 	t2.addHeaderParameter(s4);
			// 		t2.setUploadUrl(url2);

			// }	
			// }
		},
		onBeforeUploadStarts: function (e) {
			var t = e.getSource();
			var regex = /[!"#$%&'()*+,.-/:;<=>?@[\]^_`{|}~]/g;
			var fullName = e.getParameter("fileName");
			var myArr = fullName.split("."),
				fileType = myArr[myArr.length - 1],
				fName = myArr[0].replace(regex, '');
			fName = fName.replace(/Ü/g, "U");
			fName = fName.replace(/ü/g, "u");
			fName = fName.replace(/İ/g, "I");
			fName = fName.replace(/ı/g, "i");
			fName = fName.replace(/Ö/g, "O");
			fName = fName.replace(/ö/g, "o");
			fName = fName.replace(/Ç/g, "C");
			fName = fName.replace(/ç/g, "c");
			fName = fName.replace(/Ğ/g, "G");
			fName = fName.replace(/ğ/g, "g");
			fName = fName.replace(/Ş/g, "S");
			fName = fName.replace(/ş/g, "s");
			var fileName = fName + "." + fileType;
			valueFeed = valueFeed + fileName;
			var s1 = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: fileName
			});
			e.getParameters().addHeaderParameter(s1);
		},
		onPressDosya: function (oEvent) {
				itemnumber = oEvent.getSource().getBindingContext("docDetailModel").getObject().Itemno;
					
			var IstekNo = this.Expno;
			var oFragmentModel = new sap.ui.model.json.JSONModel({
				dialogTitle: IstekNo
			});
			this.getView().setModel(oFragmentModel, "fragment");
			this.onDocShow2(IstekNo);
			// sap.ui.getCore().byId("idDocListD1").setVisible(true);

			if (!this.dosya) {
				this.dosya = sap.ui.xmlfragment("eve.ui.Z_MMASRAF01.fragment.Dosya", this);
				this.getView().addDependent(this.dosya);
			}
			this.dosya.open();
			// for(var i = 0; i<sepet.length; i++ ){

			// 	sap.ui.getCore().byId("uploadColIkDokuman").addItem(sepet[i]);
			// }

		},
		onUploadComplete: function (e) {
			var item = new sap.m.UploadCollectionItem({
				fileName: e.getParameters().getParameters().fileName,
				enableEdit: false,
				enableDelete: true,
				visibleDelete: false,
				visibleEdit: false
			});
			sap.ui.getCore().byId("fragUpload").addItem(item);
			// this.getView().byId("idDosyaButton").setIcon("sap-icon://accept");

			// this.getView().byId("idDosyaButton1").setIcon("sap-icon://accept");
			// var that = this;
			// that.onPressExit1();
			// that.onPressDosyaForm();
			// sepet.push(item);
		},
		onDocShow2: function (IstekNo) {
			var filter = [];
			var sServiceURL = this.getView().getModel().sServiceUrl;
			// var IstekNo = "F111";
			filter.push(new sap.ui.model.Filter("IvReqid", sap.ui.model.FilterOperator.EQ, IstekNo));
			filter.push(new sap.ui.model.Filter("IvItemno", sap.ui.model.FilterOperator.EQ, itemnumber));
			var that = this;
			var oModel = this.getView().getModel();
			oModel.read("/DocList2Set", {
				filters: filter,
				success: function (resp) {
					tableDocShow2 = [];
					if (resp.results.length === 0) {
						that.bindView2D();
					} else {
						var tableDocShow3 = [];
						for (var mt = 0; mt < resp.results.length; mt++) {
							var url = sServiceURL + "/" + "FileUSet(IvReqid='" + IstekNo +
								"',IvItemno='" + itemnumber +
								"',IvDocid='" + resp.results[mt].Docid + "')/$value";
							resp.results[mt].url = url;
							var Guid = resp.results[mt].Guid;
							if (tableDocShow3.length !== 0) {
								if (tableDocShow3.findIndex(x => x.Guid === Guid) === 0) {
									tableDocShow3.push(resp.results[mt]);
								} else {
									tableDocShow3 = [];
									tableDocShow3.push(resp.results[mt]);
								}
							} else {
								tableDocShow3.push(resp.results[mt]);
							}

							// var index = talepMsg.findIndex(x => x.Guid === Guid);
							// talepMsg[index].tableDocShow3 = tableDocShow3;

							tableDocShow2.push(resp.results[mt]);
							// urldosya = resp.results[mt].url;
						}
						that.bindView3D();
						// that.bindViewD();
					}
				},
				error: function () {}
			});
		},
		bindView2D: function () {
			var oViewModel = new sap.ui.model.json.JSONModel();
			oViewModel.setData({
				tableDocShow2: tableDocShow2
			});
			this.getView().setModel(oViewModel, "DocList2");
			this.getView().getModel("DocList2").refresh(true);
		},
		bindView3D: function () {
			var oViewModel = new sap.ui.model.json.JSONModel();
			oViewModel.setData({
				tableDocShow2: tableDocShow2
			});
			this.getView().setModel(oViewModel, "DocList2");
			this.getView().getModel("DocList2").refresh(true);

		},
		onFileDeleted: function (oEvent) {

			var obj = oEvent.getParameter("item").getBindingContext("detailView").getObject();
			this.getView().getModel("detailView").setProperty("/screenOptions/busyUploadCollect", true);

			var that = this;
			var oModel = this.getView().getModel();
			oModel.remove("/DocListSet(Expno='" + this.Expno + "',Itemno='" + this.Itemno + "',Docid='" + obj.Docid + "')", {
				success: function () {
					// that.onReadDoc();

					that.getModel().refresh();

					// that.createFrag.close();
					that.getDocumentDetail(that.Expno);
					that.masterRefresh();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {}
			});
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		masterRefresh: function () {
			var that = this;
			var _oComponent = that.getOwnerComponent();
			var oList = _oComponent.oListSelector._oList;
			var oListBinding = oList.getBinding("items");
			oListBinding.refresh(true);
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Expno,
				sObjectName = oObject.Expno,
				oViewModel = this.getModel("detailView");
			Doc = oObject.Dokuman;

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		},
		onMessagePopoverPress: function (oEvent) {

			var oMessagesButton = oEvent.getSource();
			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					items: {
						path: "message>/",
						template: new MessagePopoverItem({
							description: "{message>description}",
							type: "{message>type}",
							title: "{message>message}"
						})
					}
				});
				oMessagesButton.addDependent(this._messagePopover);
			}
			this._messagePopover.toggle(oMessagesButton);

		},
		Messages: function (bapiret) {
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();

			oMessageManager.removeAllMessages();

			for (var a in bapiret) {
				if (bapiret[a].Type === "E") {
					oMessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: bapiret[a].Message,
							type: sap.ui.core.MessageType.Error,
							processor: oMessageProcessor
						})
					);
				} else if (bapiret[a].Type === "S") {
					oMessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: bapiret[a].Message,
							type: sap.ui.core.MessageType.Success,
							processor: oMessageProcessor
						})
					);
				} else if (bapiret[a].Type === "W") {
					oMessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: bapiret[a].Message,
							type: sap.ui.core.MessageType.Warning,
							processor: oMessageProcessor
						})
					);
				}
			}
		}
	});

});