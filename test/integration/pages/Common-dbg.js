sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5) {
	"use strict";

	return Opa5.extend("eve.ui.Z_MMASRAF01.test.integration.pages.Common", {

		createAWaitForAnEntitySet : function  (oOptions) {
			return {
				success: function () {
					var aEntitySet;

					var oMockServerInitialized = this.getMockServer().then(function (oMockServer) {
						aEntitySet = oMockServer.getEntitySetData(oOptions.entitySet);
					});

					this.iWaitForPromise(oMockServerInitialized);
					return this.waitFor({
						success : function () {
							oOptions.success.call(this, aEntitySet);
						}
					});
				}
			};
		},

		getMockServer : function () {
			return new Promise(function (success) {
				Opa5.getWindow().sap.ui.require(["eve/ui/Z_MMASRAF01/localService/mockserver"], function (mockserver) {
					success(mockserver.getMockServer());
				});
			});
		}

	});

});