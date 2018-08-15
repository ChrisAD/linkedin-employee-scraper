// ==UserScript==
// @name         LinkedIn employee extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       You
// @include  https://www.linkedin.com/search/results/people/?facetCurrentCompany=*
// @version  1
// @connect  linkedin.com
// @run-at   document-end
// @grant    GM_getValue
// @grant    GM_setValue
// @grant    GM_deleteValue
// @require  https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.3.1.min.js
// @icon https://cdn2.hubspot.net/hubfs/4452610/favico-1.png
// ==/UserScript==
(function() {
    'use strict';

var scroll = 250;
var all = [];
function printnames() {
	setTimeout(function() {
		$(".actor-name").map(function() {
			all.push(this.innerHTML);
		});
		window.scrollTo(0,scroll);
		if(Math.ceil($(window).scrollTop() + $(window).height()) == $(document).height()) {
            //Reset the scroll value. It will be reset anyways by the userscript reloading, but nice to have if needed to run this within browser console
			scroll = 0;
            //Get values from userscript
            var allEmps = JSON.parse (GM_getValue ("employees",  null) )
            var joined = all.concat(allEmps); //Join the arrays
            //Save values in userscript
            //console.log("Done with page, pushing this into userscript storage: " + JSON.stringify (joined))
            GM_setValue ("employees",  JSON.stringify (joined) );
			if($(".next").length > 0) {
			     //Parse URL and load new URL instead of clicking the Next button. Clicking next is normally acceptable, but LinkedIn is weird, and doesn't properly reload the URL, hence doesn't trigger the userscript
                 var url = window.location.href;
				 var search = "page=";
				 var changeIndex = url.indexOf("page=")+search.length;
				 var newPage = parseInt(url.substring(changeIndex, changeIndex+1)) + 1;
				 url = url.substring(0,url.length -1) + newPage;
                 //console.log("Loading url: " + url);
				 window.location.replace(url);
			} else {
                //Get only uniques since this is final execution of the script
                var unique = joined.filter((v, i, a) => a.indexOf(v) === i);
                console.log("Collected " + unique.length + " employees...");
                console.log(unique.join("\n"));
                GM_deleteValue("employees");
            };
		} else {
		 	scroll += 350;
			printnames();
		}
	}, 1000);
};
printnames();
})();