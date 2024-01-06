sap.ui.define(["sap/ui/test/opaQunit","./pages/NotFound","./pages/Master"],function(e){"use strict";QUnit.module("Phone not found");e("Should see the not found page if the hash is something that matches no route",function(e,t,o){e.iStartMyFLPApp({intent:"MerkezMasrafGiris-display",hash:"somethingThatDoesNotExist"});o.onTheNotFoundPage.iShouldSeeTheNotFoundPage().and.theNotFoundPageShouldSayResourceNotFound();o.iLeaveMyFLPApp()});e("Should see the not found detail page if an invalid object id has been called",function(e,t,o){e.iStartMyFLPApp({intent:"MerkezMasrafGiris-display",hash:"/MasterSet/SomeInvalidObjectId"});o.onTheNotFoundPage.iShouldSeeTheObjectNotFoundPage().and.theNotFoundPageShouldSayObjectNotFound();o.iLeaveMyFLPApp()});e("Should see the not found text for no search results",function(e,t,o){e.iStartMyFLPApp({intent:"MerkezMasrafGiris-display"});t.onTheMasterPage.iSearchForSomethingWithNoResults();o.onTheMasterPage.iShouldSeeTheNoDataTextForNoSearchResults();o.iLeaveMyFLPApp()})});