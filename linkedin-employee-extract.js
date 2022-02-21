// ==UserScript==
// @name         LinkedIn employee extractor
// @namespace    http://tampermonkey.net/
// @version      1
// @author       You
// @include  https://www.linkedin.com/search/results/people/?currentCompany=*
// @run-at   document-end
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @require  https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.3.1.min.js
// @icon https://riversecurity.eu/wordpress/wp-content/uploads/2020/06/cropped-3-32x32.png
// ==/UserScript==

//Set to true to turn on debugging
var debug = false;

if (debug) console.log("Greasemonkey-linkedin script loaded");
var allEmps = [];
var allTitles = [];

function printnames() {
    if (debug) console.log("Entering printnames()");
    setTimeout(parsePage,1000);
};

function parsePage() {
    var codeElems=document.getElementsByTagName("code");
    var peopleJsonId=0;
    for(var i=0;i<codeElems.length;i++) {
        if(codeElems[i].innerText.search("SearchClusterCollectionMetadata")>0) {
            peopleJsonId=i;
        }
    };
    var peopleJsonVal=codeElems[peopleJsonId].innerText;
    var jsonparse=JSON.parse(peopleJsonVal);

    if (debug) {
        console.log(peopleJsonId);
        console.log(peopleJsonVal);
        console.log(jsonparse.stringify);
        console.log(jsonparse.included);
        console.log(jsonparse.included.length)
    }

    for(var j=0; j<jsonparse.included.length; j++) {
        var employeeObj=jsonparse.included[j].title;
        var titleObj=jsonparse.included[j].primarySubtitle;
        if(typeof(employeeObj)!== 'undefined') {
            if(employeeObj.text != "LinkedIn Member") {
                var employee=employeeObj.text;
                var title=titleObj.text;
                if (debug) console.log(employee + " - " + title);
                allEmps.push(employee);
                allTitles.push(title);
            }
        }
    }

    //Get previously stored values from userscript
    var allEmpsPrev = JSON.parse(GM_getValue("employees", null)); if (allEmpsPrev == null) allEmpsPrev = [];
    var allTitlesPrev = JSON.parse(GM_getValue("titles", null)); if (allTitlesPrev == null) allTitlesPrev = [];

    //clear
    GM_deleteValue("employees");
    GM_deleteValue("titles");
    //Merge the current and previous
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
        for (var k = 0; k < joinedEmps.length; k++) {
            combined.push(joinedEmps[k] + "|" + joinedTitles[k]);
        }
        if (debug) console.log(combined);

        //Get only uniques since this is final execution of the script
        var uniqueAll = combined.filter((v, k, a) => a.indexOf(v) === k);

        console.log("Collected " + uniqueAll.length + " employees and titles..");
        console.log(uniqueAll);
        GM_deleteValue("employees");
        GM_deleteValue("titles");
    };
};

printnames();
