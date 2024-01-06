sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue : function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
			statu1Format: function (e) {
			if (e === "3") {
				return "Mali Müşavir Onayı Bekleyen"
			} else if (e === "2" ) {
				return "Muhasebe Onayı Bekleyen"
			}else if (e === "4") {
				return "GM Onayı Bekleyen"
			}else if (e === "5") {
				return "GM Onaylı"
			} else if (e === "0") {
				return "Uygun"
			}  else if (e === "R") {
				return "Reddedildi"
			} else if (e === "1") {
				return "HR Onayı Bekleyen"
			}
		},
			onaySaatFormatter: function (saat) {
			// saat bir string veya başka bir türdeyse, aşağıdaki satırı kullanarak bir Date nesnesine çevirebilirsiniz
			// var date = new Date(saat);
			return saat;
		},
		
		statuFormat: function (sValue) {

			if (sValue === "0") {
				return "Warning";
			} else if ( (sValue === "R")) {
				return "Error";
			}else if (sValue === "O") {
				return "Success";
			} else {
				return "Warning";
			}

		},
		
		
		
		kalemStatu: function (val) {
			if (val === "") {
				return "Uygun";
			} else if (val === "A") {
				return "Uygun";
			} else if (val === "B") {
				return "Onay Verilen";
			} else if (val === "C") {
				return "Reddedilen";
			} else if (val === "D") {
				return "Onay Bekleyen";
			} else if (val === "F") {
				return "Muhasebe Reddetti";
			}
		},
		
		buttonVis: function (sValue) {

			if (sValue === "D") {
				return false;
			} else if ( (sValue === "C") || (sValue === "F") ) {
				return true;
			} else if (sValue === "A") {
				return true;
			} else {
				return false;
			}

		},
		modeTable: function (sValue) {

			if (sValue === "D") {
				return "None";
			} else if ( (sValue === "C") || (sValue === "F") ) {
				return "Delete";
			} else if (sValue === "0") {
				return "Delete";
			} else {
				return "None";
			}

		}
		
	};
});