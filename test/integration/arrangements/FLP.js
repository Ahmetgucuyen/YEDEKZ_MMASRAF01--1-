sap.ui.define(["sap/ui/test/Opa5","sap/ui/core/routing/HashChanger","sap/ui/dom/includeStylesheet"],function(e,t,n){"use strict";function s(){n(sap.ui.require.toUrl("sap/ui/test/OpaCss.css"));var e=document.body;e.style.width="80%";e.style.left="20%";e.style.position="absolute";if(!e.classList.contains("sapUiOpaBodyComponent")){e.classList.add("sapUiOpaBodyComponent")}var t=document.getElementById("content");if(!t){t=document.createElement("div");t.setAttribute("id","content");e.appendChild(t)}t.style.width="80%"}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",s):s();return e.extend("eve.ui.Z_MMASRAF01.test.integration.arrangements.FLP",{iLeaveMyFLPApp:function(){return this.waitFor({success:function(){(new t).setHash("Shell-home")}})}})});