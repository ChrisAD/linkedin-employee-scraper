// ==UserScript==
// @name         LinkedIn employee extractor
// @namespace    http://tampermonkey.net/
// @version      1
// @author       You
// @include  https://www.linkedin.com/search/results/people/?facetCurrentCompany=*
// @run-at   document-end
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @require  https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.3.1.min.js
// @icon https://cdn2.hubspot.net/hubfs/4452610/favico-1.png
// ==/UserScript==

//Set to true to turn on debugging
var debug = false;

(function () {
    'use strict';

    if (debug) console.log("Greasemonkey-linkedin script loaded");

    var scroll = 250;
    var allEmps = [];
    var allTitles = [];
    function printnames() {
        if (debug) console.log("Entering printnames()");
        setTimeout(function () {
            $(".actor-name").map(function () {
                if (this && this.innerHTML) {
                    allEmps.push(this.innerHTML);
                }
            });
            $(".subline-level-1").map(function () {
                if (this && this.innerText) {
                    allTitles.push(this.innerText);
                }
            });

            window.scrollTo(0, scroll);

            //Look for end of page
            if (Math.ceil($(window).scrollTop() + $(window).height()) == $(document).height()) {
                if (debug) console.log("End of current page matched");
                //Reset the scroll value. It will be reset anyways by the userscript reloading, but nice to have if needed to run this within browser console
                scroll = 0;
                //Get previously stored values from userscript
                var allEmpsPrev = JSON.parse(GM_getValue("employees", null)); if (allEmpsPrev == null) allEmpsPrev = [];
                var allTitlesPrev = JSON.parse(GM_getValue("titles", null)); if (allTitlesPrev == null) allTitlesPrev = [];
                if (debug) console.log(allEmps)
                //Combine previous results with current
                var joinedEmps = allEmps.concat(allEmpsPrev);
                var joinedTitles = allTitles.concat(allTitlesPrev);

                //If allEmps.length == 0 we have reached a page without any employee data. so assume we are on last page+1:
                if (allEmps.length > 0) {
                    if (debug) console.log("allEmps != null")
                    //Save values in userscript
                    if (debug) console.log("Done with page, pushing Employees into userscript storage: " + JSON.stringify(joinedEmps));
                    if (debug) console.log("Done with page, pushing Titles into userscript storage: " + JSON.stringify(joinedTitles));
                    GM_setValue("employees", JSON.stringify(joinedEmps));
                    GM_setValue("titles", JSON.stringify(joinedTitles));

                    //Parse URL and load new URL instead of clicking the Next button. Clicking next is normally acceptable, but LinkedIn is weird, and doesn't properly reload the URL, hence doesn't trigger the userscript
                    var url = window.location.href;
                    if (debug) console.log("url orig: " + url);
                    var search = "page=";
                    //Make sure page is present. allows script to run from https://www.linkedin.com/search/results/people/?facetCurrentCompany=[<id>]
                    if (url.indexOf("page=") == -1) {
                        url = url + "&page=1";
                        changeIndex = url.indexOf("page=") + search.length;
                    }
                    var changeIndex = url.indexOf("page=") + search.length;
                    var curPage = parseInt(url.substring(changeIndex, url.length));
                    var newPage = curPage + 1;
                    url = url.substring(0, url.length - curPage.toString().length) + newPage;
                    if (debug) console.log("Loading url: " + url);
                    window.location.replace(url);
                } else {
                    if (debug) console.log("allEmps == null")
                    //Combine names and titles
                    var combined = [];
                    for (var i = 0; i < joinedEmps.length; i++) {
                        combined.push(joinedEmps[i] + "|" + joinedTitles[i]);
                    }
                    if (debug) console.log(combined);

                    //Get only uniques since this is final execution of the script
                    var uniqueAll = combined.filter((v, i, a) => a.indexOf(v) === i);

                    console.log("Collected " + uniqueAll.length + " employees and titles..");
                    console.log(uniqueAll);
                    GM_deleteValue("employees");
                    GM_deleteValue("titles");
                };
            } else {
                if (debug) console.log("Scrolling..");
                scroll += 350;
                printnames();
            }
        }, 1000);
    };
    printnames();
})();
