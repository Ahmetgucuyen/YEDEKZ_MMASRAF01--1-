sap.ui.define(["sap/ui/test/Opa5"],function(e){"use strict";return e.extend("eve.ui.Z_MMASRAF01.test.integration.pages.Common",{createAWaitForAnEntitySet:function(e){return{success:function(){var t;var i=this.getMockServer().then(function(i){t=i.getEntitySetData(e.entitySet)});this.iWaitForPromise(i);return this.waitFor({success:function(){e.success.call(this,t)}})}}},getMockServer:function(){return new Promise(function(t){e.getWindow().sap.ui.require(["eve/ui/Z_MMASRAF01/localService/mockserver"],function(e){t(e.getMockServer())})})}})});