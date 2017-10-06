// ==UserScript==
// @id             portal-status-slack@puppy0cam
// @name           IITC plugin: SSR - Slack Status Reports
// @category       Controls
// @version        0.0.7.1
// @namespace      https://github.com/puppy0cam/SSR
// @description    Create a status report to copy/paste into slack | backend by puppy0cam | formatting by aladrin
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// @updateURL      http://puppy0cam.github.io/SSR/SSR.meta.js
// @downloadURL    http://puppy0cam.github.io/SSR/SSR.user.js
// ==/UserScript==

function wrapper(plugin_info) {
    if (typeof window.plugin !== 'function') window.plugin = function() {};
    plugin_info.buildname = 'iitc';
    plugin_info.dateTimeVersion = '20170325.0';
    plugin_info.pluginId = 'SSR-by-puppy0cam';
    window.plugin.SSR = function() {};

    window.plugin.SSR.loadExternals = function() {

        window.plugin.SSR.getBookmarkedPortals = function(){ //looks like until i work out how to make it pull everything from bookmarks only we are stuck with this...
            if (typeof scanGuids !== 'undefined') {
                var found = scanGuids;
            } else {
                var found = [];
                for (var key in portals) { //I hate using "in" because arrays just make it so much easier
                    found.push(key);
                }
            }
            var founder = [];
            found.forEach(function (currentValue){ //giving the vital information to it
                var temp1356 = window.plugin.bookmarks.findByGuid(currentValue);
                if (temp1356 !== undefined) {
                    temp1356.guid = currentValue;
                    temp1356.folderLabel = window.plugin.bookmarks.bkmrksObj.portals[temp1356.id_folder].label;
                    founder.push(temp1356);
                }
            });
            return founder;
        };

        window.plugin.SSR.bookmarkedPortals = window.plugin.SSR.getBookmarkedPortals(); //was having issues with execution timing so this has been my solution
        window.plugin.SSR.completedPortals = [];
        window.plugin.SSR.friendlyTimer = 100;
        window.plugin.SSR.applyData = function(currentValue,position) {
            var thisPortal = new Promise(function(resolve,reject){
                var portalStuff = {};
                portalStuff.bookmark = currentValue;
                portalStuff.details = window.portalDetail.get(portalStuff.bookmark.guid);
                if (typeof portalStuff.details === 'undefined') {
                    setTimeout(function(){window.portalDetail.request(portalStuff.bookmark.guid);},window.plugin.SSR.friendlyTimer);
                    setTimeout(function(){
                        portalStuff.details = window.portalDetail.get(portalStuff.bookmark.guid);
                        if(typeof portalStuff.details === 'undefined') {
                            window.plugin.SSR.applyData(currentValue,position);
                            reject(Error("could not retrieve portal details",position));
                        } else {
                            portalStuff.links = window.getPortalLinks(portalStuff.bookmark.guid);
                            resolve(portalStuff,position);
                        }
                    },window.plugin.SSR.friendlyTimer+1000);
                    window.plugin.SSR.friendlyTimer += 400;
                } else {
                    portalStuff.links = window.getPortalLinks(portalStuff.bookmark.guid);
                    window.plugin.SSR.friendlyTimer += 400;
                    resolve(portalStuff,position);
                }
            });
            window.plugin.SSR.completedPortals[position] = thisPortal;
        };

        window.plugin.SSR.modcode = {
            "common portal shield":":cps:",
            "common heat sink":":chs:",
            "common multi-hack":":cmh:",
            "rare portal shield":":rps:",
            "rare heat sink":":rhs:",
            "rare multi-hack":":rmh:",
            "rare link amp":":rla:",
            "rare turret":":rt:",
            "rare force amp":":rfa:",
            "very_rare portal shield":":vrps:",
            "very_rare heat sink":":vrhs:",
            "very_rare multi-hack":":vrmh:",
            "very_rare link amp":":vrla:",
            "very_rare axa shield":":axa:",
            "very_rare softbank ultra link":":sbul:",
            "very_rare ito en transmuter (-)":":transmuter_attack:",
            "very_rare ito en transmuter (+)":":transmuter_defend:"
        };
        window.plugin.SSR.allPortalDetails = function() {
            window.plugin.SSR.completedPortalCount = 0;
            window.plugin.SSR.completedPortals = [];
            window.plugin.SSR.friendlyTimer = 100;
            window.plugin.SSR.bookmarkedPortals.forEach(window.plugin.SSR.applyData);
            return {
                'start': 0,
                'finish': (window.plugin.SSR.bookmarkedPortals.length - 1)
            };
        };
        window.plugin.SSR.compareAfterInfo = function(a, b) {
            if (Number(a.bkmrk.id_bookmark.slice(2)) <= Number(b.bkmrk.id_bookmark.slice(2))) {
                return -1;
            }
            if (Number(a.bkmrk.id_bookmark.slice(2)) >= Number(b.bkmrk.id_bookmark.slice(2))) {
                return 1;
            }
            // a must be equal to b
            return 0;
        };
        window.plugin.SSR.stepTwo = function() {	//there is step two to this
            window.plugin.SSR.sortAfterInfo = [];
            window.plugin.SSR.afterInfo = ""; //stores the text output
            setTimeout(function(){
                window.plugin.SSR.completedPortals.forEach(function(currentValue,position) { //goes through data, and turns needed information into a string to paste into slack


                    currentValue.then(function(fulfill,location){
                        //if the request works then it will run this code
                        var string = "\n";
                        if(typeof window.portalDetail.get(fulfill.bookmark.guid) === "undefined") {
                            window.portalDetail.request(fulfill.bookmark.guid);
                        }
                        setTimeout(function () {

                            var __PortalDetails_ = window.portalDetail.get(fulfill.bookmark.guid);



                            // Portal Level
                            if (__PortalDetails_.team === "N") {
                                string = ":p0:";
                            } else {
                                string = (":" + __PortalDetails_.team.toLowerCase() + "\p" + __PortalDetails_.level + ":");
                            }

                            // Portal Name
                            string += ( __PortalDetails_.title );

                            if (__PortalDetails_.team !== "N") {

                                // New Line
                                string += ("\r\n");

                                // Portal Resonators
                                if (window.plugin.SSR.visibility.resonators) {
                                    var a = [];
                                    __PortalDetails_.resonators.forEach(function(currentValue){
                                        a.push(currentValue.level);
                                    });
                                    a.sort( function(a , b ) { return a - b; });
                                    a = a.reverse();
                                    a.forEach(function(currentValue){
                                        string += ":r" + currentValue +":";
                                    });
                                    // Blank Resonator Space
                                    var resCounter = 8 - __PortalDetails_.resCount;
                                    while (resCounter !== 0) {
                                        string += ":white_large_square:";
                                        resCounter -= 1;
                                    }
                                }

                                // Inline Chunk Division Symbol
                                string += "|";

                                // Portal Mods
                                if (window.plugin.SSR.visibility.mods) {

                                    var __PortalMods = window.getModDetails(__PortalDetails_).mods;
                                    $.each(__PortalDetails_.mods, function(ind, mod) {
                                        if (mod) {
                                            string += window.plugin.SSR.modcode[(mod.rarity + " " + mod.name).toLowerCase()];
                                        } else {
                                            string += ":white_large_square:";
                                        }
                                    });
                                }

                                // Portal Links
                                if (window.plugin.SSR.visibility.links) {
                                    var __PortalLinks = window.getPortalLinks(fulfill.bookmark.guid);
                                    if (__PortalLinks.in.length + __PortalLinks.out.length !== 0) {
                                        if (__PortalLinks.in.length !== 0) {
                                            // Inline Chunk Division Symbol
                                            string += "|";
                                            string += __PortalLinks.in.length + "i";
                                        }
                                        if (__PortalLinks.out.length !== 0) {
                                            // Inline Chunk Division Symbol
                                            string += "|";
                                            string+= __PortalLinks.out.length + "o";
                                        }
                                    }
                                }

                                // Portal Health
                                if (window.plugin.SSR.visibility.health) {
                                    if (__PortalDetails_.health !== 100) {
                                        // Inline Chunk Division Symbol
                                        string += "|";
                                        string += __PortalDetails_.health + "\% ";
                                    }
                                }
                            }

                            string += "\r\n";
                            window.plugin.SSR.afterInfo += string;
                            window.plugin.SSR.sortAfterInfo.push({
                                'bkmrk': fulfill.bookmark,
                                'string': string
                            });
                        }, 5000);
                    },function(rejection,location){
                        //if the request fails then it will run this code
                        window.plugin.SSR.afterInfo += "\nsorry, but we had an error loading this portal's info. please try again.\r\n";
                    });
                });
            },10000);
        };

        window.plugin.SSR.visibility = {
            'health': false,
            'links': false,
            'resonators': true,
            'mods': true
        };

        window.plugin.SSR.getOptions = function(){
            folders = {};
            list = JSON.parse(localStorage['plugin-bookmarks'])['portals'];
            for(var idFolders in list) {
                folders[idFolders] = { 'label': list[idFolders]['label'], 'state': false };
            }
            var div = window.document.createElement('div');
            var p = window.document.createElement("p");
            p.innerText = "Bookmark folder(s) to scan";
            div.appendChild(p);
            sFolders = Sugar.Object(folders);
            sFolders.forEach(function(currentValue,pos){
                var label = window.document.createElement('label');
                var a = window.document.createElement('a');
                var checkbox = window.document.createElement('input');
                checkbox.type = "checkbox";
                a.innerText = folders[pos]['label'];
                checkbox.checked = folders[pos]['state'];
                checkbox.onclick = function(){
                    folders[pos]['state'] = this.checked;
                };
                label.appendChild(checkbox);
                label.appendChild(a);
                div.appendChild(label);
                div.appendChild(window.document.createElement('br'));
            });
            // options
            var p2 = window.document.createElement("p");
            p2.innerText = "Options";
            div.appendChild(p2);
            window.plugin.SSR.hyperVisibility = Sugar.Object(window.plugin.SSR.visibility);
            window.plugin.SSR.hyperVisibility.forEach(function(currentValue,pos){
                var label2 = window.document.createElement('label');
                var a2 = window.document.createElement('a');
                var checkbox2 = window.document.createElement('input');
                checkbox2.type = "checkbox";
                a2.innerText = (pos.charAt(0).toUpperCase() + pos.slice(1));
                checkbox2.checked = window.plugin.SSR.visibility[pos];
                checkbox2.onclick = function(){
                    window.plugin.SSR.visibility[pos] = this.checked;
                };
                label2.appendChild(checkbox2);
                label2.appendChild(a2);
                div.appendChild(label2);
                div.appendChild(window.document.createElement('br'));
            });
            var p2 = window.document.createElement("p");
            p2.innerText = "SCAN and wait for results";
            div.appendChild(p2);
            dialog({
                id: "SSR",
                html: div,
                title: "Slack Status Report",
                buttons: {
                    "SCAN": function() {
                        window.plugin.SSR.generateReport()
                    }
                }
            });
        };

        window.plugin.SSR.presentResults = function() {
            var ref = 0;
            var isAndroid = /(android)/i.test(navigator.userAgent);
            dialog({
                id: "SSR_results",
                title: "SSR Results",
                html: "<h3 id=\"SSR_results_head\">Page " + (ref+1) + "/" + (window.plugin.SSR.chunkedAfterInfo.length) + "</h3><br><textarea id=\"SSR_results_textarea\">" + window.plugin.SSR.chunkedAfterInfo[ref] + "</textarea>",
                buttons: {
                  "SELECT": function() {
                      if (isAndroid) {
                          window.androidCopy(window.plugin.SSR.chunkedAfterInfo[ref]);
                          window.document.getElementById('SSR_results_textarea').value = "Copied to clipboard";
                      }   else {
                        window.document.getElementById('SSR_results_textarea').select();
                   }
                  },
                  "NEXT": function() {
                    ref++;
                    if(ref >= window.plugin.SSR.chunkedAfterInfo.length) {
                        window.document.getElementById('SSR_results_textarea').value = "Finished";
                    } else {
                        window.document.getElementById('SSR_results_textarea').value = window.plugin.SSR.chunkedAfterInfo[ref];
                        SSR_results_head.innerText = "Page " + (ref+1) + "/" + (window.plugin.SSR.chunkedAfterInfo.length);
                    }
                  }
                }
          }); 
    let scrollTop = window.document.body.scrollTop;
    let body = window.document.body;
    let tmp = window.document.createElement('input');
    tmp.style.opacity = 0;
    body.appendChild(tmp);
    tmp.focus();
    body.removeChild(tmp);
    body.scrollTop = scrollTop;

        };
      
        window.plugin.SSR.generateReport = function(){ //runs the first report request automatically
            var ss = sFolders.filter( function(obj) {
                return (
                    obj.state == true
                );
            });

            scanGuids = [];
            for (var idFolders in ss.raw) {

                for (var itemVar in list[idFolders]['bkmrk']) {
                    scanGuids.push(list[idFolders]['bkmrk'][itemVar]['guid']);
                }
            }

            window.plugin.SSR.bookmarkedPortals = window.plugin.SSR.getBookmarkedPortals();
            setTimeout(window.plugin.SSR.allPortalDetails,3000); //wait to give the getBookmarkedPortals time to execute
            setTimeout(function(){
                setTimeout(window.plugin.SSR.stepTwo,window.plugin.SSR.friendlyTimer+1000); //wait to give the previous step time to request portal information.
                setTimeout(function() {
                    window.plugin.SSR.sortAfterInfo.sort(window.plugin.SSR.compareAfterInfo);
                    window.plugin.SSR.afterInfo = "";
                  window.plugin.SSR.chunkedAfterInfo = [];
                    window.plugin.SSR.sortAfterInfo.forEach(function(currentValue){
                      if ((window.plugin.SSR.afterInfo.length + currentValue.string.length) > 4000 ) {
                         window.plugin.SSR.chunkedAfterInfo.push(window.plugin.SSR.afterInfo);
                        window.plugin.SSR.afterInfo = "";
                      }
                        window.plugin.SSR.afterInfo += currentValue.string;
                    });
                  window.plugin.SSR.chunkedAfterInfo.push(window.plugin.SSR.afterInfo);
                    window.plugin.SSR.presentResults();
                   
                },window.plugin.SSR.friendlyTimer+30000);

            },5000);
        };

        //do note that you may have to rerun this functon if any errors spit out in console as there is a maximum speed you can request the portal details from intel.
        //its smart enough to remember the portal details from the previous execution as that part is a function provided by either IITC or niantic
        //the more portals in your bookmarks that you have looked at in this browsing session, the more times you will have to run it.

        //-------------------------------------------
        //            INTEL BUTTONS

        $('#toolbox').append(' <a id=\"portalStatusBtn\" onclick="window.plugin.SSR.getOptions();">SSR</a>'); //run SSR button

    };

    var setup = window.plugin.SSR.loadExternals;

    setup.info = plugin_info; //add the script info data to the function as a property
    if(!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
var setupSugar = window.document.createElement("script");
setupSugar.type="text/javascript";
setupSugar.charset="UTF-8";
setupSugar.src="https://drive.google.com/uc?export=download&id=0B5zSZEz0MyFJMGNxVE05NUxZRU0";
window.document.head.append(setupSugar);
