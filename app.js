
debug = false;

/*----------------------------------------------------------------*/
//                         Initialiaze                            //
/*----------------------------------------------------------------*/
var results = document.querySelector("#result")
var pngContainer = document.querySelector("#png-container");
var containerH = document.querySelector(".barcodeContainer");
var digits = document.querySelector ("#digits");
barcodeCount(0)
updateSettings()

var pagepxHeight = 1789.5//-500
var pagepxWidth = 1275.5;//-500 //offset to fit pdf hardcode workaround

var textForNumbers = [];


(function () {
    var sizeArray = JSON.parse(localStorage.getItem("sizeArray"))
    if (sizeArray) {
        var h = document.querySelector("#barcode_height");
        var w = document.querySelector("#barcode_width");
        var fS = document.querySelector("#barcode_fontSize");

        h.value=sizeArray.Luftplacering[0];
        w.value=sizeArray.Luftplacering[1];
        fS.value=sizeArray.Luftplacering[2];
    }
    initializeTxtBtn ()

    if (debug) {
        openDialog (1, document.querySelectorAll(".buttonText")[1])
    }
}())

/*----------------------------------------------------------------*/
//                Handle main barcode creation                    //
/*----------------------------------------------------------------*/

document.querySelector("#submit").addEventListener("click", function (e) {
    results.innerHTML = "";
    rstResults() //remove content inside pngContainer and prepare for new content
    var nAr = [];
    var baseAr = [];
    var pAr = []; //Possible outcomes
    var settingsAr= [[],[]];

    var content = document.querySelector("#barcode_content").value;
    var height = document.querySelector("#barcode_height").value ? document.querySelector("#barcode_height").value : 200;
    var width = document.querySelector("#barcode_width").value ? document.querySelector("#barcode_width").value : 5;
    var fontSize = document.querySelector("#barcode_fontSize").value ? document.querySelector("#barcode_fontSize").value : 180;
    var showText = document.querySelector("#barcode_showText").checked;

    if (content || !containerH.className.includes("hidden")) {
        //hvis ikke "kompleks", generer stregkode
        if(containerH.className.includes("hidden")) {
            createBarcode(content, width, height, fontSize, showText)
        } else {
            //Først generer de ønskede tal i en array dernæst output dem til lib
            var inputs = digits.querySelectorAll(".digit")
            

            for(var i=0;i<inputs.length/2; i++) {
                //console.log(digits.querySelector("#t_digit_"+i+"").value)

                //check if its a number
                if (Number(digits.querySelector("#t_digit_"+i+"").value)) {
                    nAr.push(Number(digits.querySelector("#t_digit_"+i+"").value - digits.querySelector("#f_digit_"+i+"").value))
                } else {
                    //else push a string to the array
                    nAr.push(digits.querySelector("#t_digit_"+i+"").value)
                }       
                
                //check if its a number
                if (Number(digits.querySelector("#f_digit_"+i+"").value)) {
                    baseAr.push(Number(digits.querySelector("#f_digit_"+i+"").value))
                } else {
                    //else push string
                    baseAr.push(digits.querySelector("#f_digit_"+i+"").value)
                }
                //push settings "add 0 on 0-9 numbers" to array
                settingsAr[0].push(digits.querySelector("#barcode_include0_"+ i+"").checked)
            }

            //push extra settings to settings ar.
            var extraSettings = document.querySelectorAll(".extraSettings");
            for (let i=0;i<extraSettings.length;i++) {
                settingsAr[1].push(extraSettings[i].checked)
            }

            //[50,01,1]
            for(var i=0;i<nAr.length;i++) {
                pAr.push([])
                if(isNaN(nAr[i])) {console.log(nAr[i])
                    pAr[i].push(nAr[i])
                } else {
                    for(var x=0;x<=nAr[i];x++) {
                        pAr[i].push(baseAr[i] + x)
                    }
                } 
            }
            //console.log(pAr, baseAr, nAr, settingsAr);
            
            appendMultiple(combineArraysRecursively(pAr))
            
            //sammensæt talrækkerne rekursivt
            function combineArraysRecursively( array_of_arrays ){
                    if( ! array_of_arrays||! Array.isArray( array_of_arrays ) ||array_of_arrays.length == 0 ){
                        return [];
                    }
                    for( let i = 0 ; i < array_of_arrays.length; i++ ){
                        if( ! Array.isArray(array_of_arrays[i]) || array_of_arrays[i].length == 0 ){
                            return [];
                        }
                    }
                    let outputs = [];
                    function permute(arrayOfArrays, whichArray=0, output=[]){
                        arrayOfArrays[whichArray].forEach((array_element)=>{
                        output=output.slice(0,whichArray)
                            output.push(array_element)
                            if( whichArray == array_of_arrays.length - 1 ){
                            outputs.push( output)
                            }
                            else{
                            permute(arrayOfArrays, whichArray+1, output );
                            }
                        });
                    }
                    permute(array_of_arrays);
                    return outputs;
            }

            function appendMultiple (ar) {
                //console.log("ar ar ar ar" + ar)
                for(let i=0;i<ar.length;i++) {
                    var r = "";

                    for(let x=0;x<ar[i].length;x++) {
                        var add = ar[i][x]
                        if(settingsAr[0][x] == true && Number(add) < 10) {
                            add = "0" + add.toString()
                        }
                        if(x==ar[i].length - 1) {
                            r+= add
                        } else if (settingsAr[1][0] == true) { //if unchecked "add dash -" then add dash, else dont.
                            r+= add + "-"
                        } else if (settingsAr[1][0] == false) {
                            r+= add.toString()
                        }
                    }
                    //console.log("content: " + r + " - " + "width: " + width + " - " + "height: " + height + " - " + "fontSize: " + fontSize + " - " + "showText: " + showText)
                    createBarcode(r, width, height, fontSize, showText)
                }
                if(ar.length > 60) {
                    //fMSG(["Lang PDF!", "Være obs. på at hvis der laves mange stregkoder bør man bruge 'antal stregkoder pr. side' under layout. <br> Ellers vil PDF'ens længde være begrængset til 32.091 pixels."], "warn", 20000)
                } 
            }
        }
        addSVGtoPaper()
    } else {
        fMSG(["Øhhh", "En usynlig stregkode er blevet genereret... Måske skulle du tilføje noget indhold til stregkoden?"], "error", 15000)
    }
});

/*----------------------------------------------------------------*/
//                       fCreateBarCode                           //
/*----------------------------------------------------------------*/

//create the barcode with the help of JSBarcode 
function createBarcode (content, width=200, height=5, fontSize=180, showText=true, id="#barcode") {
    var barcode = document.querySelector("#barcode")
    width = width/2
    height = height/2
    fontSize = fontSize/2

    JsBarcode(id, content, {
        width: width,
        height: height,
        fontSize: fontSize,
        displayValue: showText,
        font: "arial",
        fontOptions: "bold"
    })
    var clone = barcode.cloneNode(true);
        clone.id = ""
        clone.dataset.content = content;
    results.appendChild(clone);
}

/*----------------------------------------------------------------*/
//                Open complex barcode section                    //
/*----------------------------------------------------------------*/

document.querySelector("#complex").addEventListener("click", function (e) {
    var complexEl = document.querySelector("#complex");
    var barcodeinput = document.querySelector("#barcode_content");
    complexEl.innerHTML = "  Kompleks ";
    if(document.querySelector(".barcodeContainer").className.includes("hidden")) {
        complexEl.innerHTML += '<i class="fas fa-chevron-up"></i>'
        containerH.className = "barcodeContainer"
        barcodeinput.className = "hide"
    } else {
        complexEl.innerHTML += '<i class="fas fa-chevron-down"></i>';
        containerH.className = "barcodeContainer hidden"
        barcodeinput.className = ""
    }
});

/*----------------------------------------------------------------*/
//             Generate n inputs for complex barcode              //
/*----------------------------------------------------------------*/

document.querySelector("#complex_nDigits").addEventListener("input", function (e) {
    resetTextForNumbers("all")
    var n = document.querySelector("#complex_nDigits").value;
    var extras = [{id:"barcode_dash", type:"checkbox", class:"extraSettings", checked:"checked", text:'  Lav bindestreg "-" imellem tallene  '}]

    digits.innerHTML = "";
    for(var i=0; i<n; i++) {
        digits.innerHTML += '<label for="f_digit_'+i+'">Fra:  </label><input id="f_digit_'+i+'" class="digit" value="1"> <label for="t_digit_'+i+'">   Til:  </label><input id="t_digit_'+i+'" class="digit" value="1"> <i class="fa-solid fa-minus"></i> <button class="buttonVerySmall buttonText" id="buttonText_'+i+'" title="Tilføj tekst til tal X (f.eks. pallehøjde)"><i class="fa-solid fa-comment-dots"></i></button>  <i  id="trash_digit_'+i+'" class="fa-solid fa-trash-arrow-up trash_digit" title="Slet tekst til tal"></i>'
        digits.innerHTML += '<div class="subsection"><label for="barcode_include0_'+i+'">  Tilføj 0 (1 --> 01):  </label><input type="checkbox" checked id="barcode_include0_'+i+'" class="include0"></div>'
    }
    for(let i=0;i<extras.length;i++) {
        digits.innerHTML += "<br>"
        digits.innerHTML += '<input type="'+extras[i].type+'" id="'+extras[i].type+'" class="'+extras[i].class+'" '+extras[i].checked+'><label for="'+extras[i].id+'">'+extras[i].text+'</label>'
    }
    initializeTxtBtn ()
});

/*----------------------------------------------------------------*/
//                 Open new window for printout                   //
/*----------------------------------------------------------------*/

document.querySelector("#savePDF").addEventListener("click", function (e) {
    if(document.querySelector("#png-container").innerHTML != "") {
        var p = document.querySelector("#png-container")
        var nWindow = window.open();
        nWindow.document.write("<div id='png-container'>"+p.innerHTML+"</div>")
        //nWindow.document.write("<link rel='stylesheet' href='style.css'></link>") // it doesn't work, fucks the print out up
        nWindow.document.write("<style id='cStyle'>"+cStyle.innerHTML+"</style>")
    } else {
        fMSG(["Fejl!", "Der var intet at gemme. Har du lavet en stregkode?"], "error", 10000)
    }
});

/*----------------------------------------------------------------*/
//                   Add SVGS to virtual "paper"                  //
/*----------------------------------------------------------------*/

function addSVGtoPaper(callback) {
    var tempContainer = document.querySelector("#result")
    var svgs = document.querySelectorAll("#result>svg")
    tempContainer.style = ""
    var addCustomText = document.querySelector("#customText").checked

    var hw = svgs[0].getBoundingClientRect()
    var svgW = hw.width;
    var svgH = hw.height;
    //console.log("W" + svgW + " H" + svgH)

    var xWidthMax = Math.floor((pagepxWidth - 200) / svgW)
    var xHeightMax = Math.floor((pagepxHeight - 200) / svgH)

    //dummy proof, in case of creating a barcode bigger than A4 page
    if (xHeightMax < 1) {fMSG(["For stor!", "Din stregkode er for høj til at passe på en stående A4 side."])}
    if (xWidthMax < 1) {fMSG(["For stor!", "Din stregkode er for bred til at passe på en stående A4 side."])}

    var currentH = 0;
    var currentW = 0;
    var barcodeRow = document.querySelector("#barcodeRow").checked;
    var barcodePerPage = document.querySelector("#barcodePerPage").checked;
    

    for(var i=0;i<svgs.length;i++) {
        var svg = svgs[i];

            //load document elements
            var p = document.querySelector("#png-container")
            var page = document.querySelector(".page")
            var table = document.querySelector(".page-table")
            var tr = document.querySelector(".page-tr")
            

            //var svgW = svgSize.width;
            //var svgH = svgSize.height;

            //if the height is overflowing, create a new page
            if(currentH >= xHeightMax || !barcodePerPage || !page) {
                nPage();
            }
            //if the width is overflowing, create a new line
            if (currentW >= xWidthMax || !barcodeRow) {
                nLine();
            }
            //then if all is gucci, add the content to the page
            if (currentW < xWidthMax && currentH < xHeightMax) {
                appendSVG()
            } else {
                //no match for either page height or page width, create a new page and try again
                nPage()
                appendSVG()
            }
            
            //append the svg to the current line and page
            function appendSVG () {
                var customText = "";
                if(addCustomText) {
                    var values = []
                    var dataset = svgs[i].dataset.content
                    
                    
                    if(dataset.includes("-")) {
                        var amountOfDash = document.querySelector("#complex_nDigits").value
                        for(var x=0;x<amountOfDash;x++) {
                            values.push(dataset.slice(0, dataset.includes("-") ? dataset.indexOf("-") : dataset.length))
                            dataset = dataset.slice(dataset.indexOf("-") + 1, dataset.length)
                        }
                        
                    } else if (dataset.includes("@")) {
                        values.push(dataset.slice(dataset.indexOf("@")+1, dataset.length))
                    }
                    
                    
                    //loop all arrays
                    textForNumbers.forEach(function(e) {
                        //loop all numbers
                        e[1].forEach(function(x) {
                            values.forEach(function(value, k) {
                                if(values[e[0]] == x["n"] && x["text"] != "") {
                                    console.log(true, " index ",  e[0], values[e[0]], " Does match ", x["n"], " AND WE HAVE A TEXT TO ADD!! YAY!!!!")
                                    if (!customText.includes("<div class='barcode_subtitle'>"+x["text"]+"</div>")) {
                                        customText += "<div class='barcode_subtitle'>"+x["text"]+"</div>"
                                    }
                                    
                                }
                            })
                        })
                    })
                }
                var td = document.createElement("td")
                    td.appendChild(svgs[i]);
                    if(customText != "") {
                        td.innerHTML += customText
                    }
                tr.appendChild(td)
                currentW += 1;
                
                //console.log("----Width : ----"+ currentW + " || Height : " + currentH)
                barcodeCount(1);
            }

            //create a new page
            function nPage () {
                //create new page
                if (!page.querySelector("svg")) {return;} //cancel if the page is already empty
                //p.innerHTML += '<div class="html2pdf__page-break"></div>'
                var nPage = document.createElement("div")
                nPage.className = "page-border"
                nPage.innerHTML = "<div class='page'><table class='page-table'><tr class='page-tr'></tr></table></div>"
                
                //remove old page's classname
                page.className = ""
                table.className = ""
                tr.className = ""

                p.appendChild(nPage);
                page = nPage;
                table = document.querySelector(".page-table")
                tr = document.querySelector(".page-tr")
                currentH = 0;
            }

            //create a new line on the page
            function nLine () {
                if (!tr.querySelector("svg")) {return;} //cancel if the page is already empty
                tr.className = ""
                var nTr = document.createElement("tr")
                    nTr.className = "page-tr"
        
                table.children[0].appendChild(nTr)
                tr = document.querySelector(".page-tr")

                currentW=0
                currentH += 1
            }
  
        
    }

    tempContainer.style = "display:none;"
}


/*----------------------------------------------------------------*/
//                     Open layout section                        //
/*----------------------------------------------------------------*/

document.querySelector("#layoutButton").addEventListener("click", function (e) {
    var styleSettingEl = document.querySelector("#layoutButton");
    var container = document.querySelector("#styleSettings_container");
        styleSettingEl.innerHTML = "Layout ";

    if(container.className.includes("hidden")) {
        styleSettingEl.innerHTML += '<i class="fas fa-chevron-up"></i>'
        container.className = " "
    } else {
        styleSettingEl.innerHTML += '<i class="fas fa-chevron-down"></i>';
        container.className = "hidden"
    }
});


/*----------------------------------------------------------------*/
//                        Reset results                           //
/*----------------------------------------------------------------*/

function rstResults () { //remove content inside pngContainer and prepare for new content
    var p = document.querySelector("#png-container")

    var addToPage = document.querySelector("#addToPage");
    if(!addToPage.checked) {
        p.innerHTML = "<div class='page-border'><div class='page'><table class='page-table'><tr class='page-tr'></tr></table></div></div>"
    } else {
        document.querySelector(".page").className = ""
        document.querySelector(".page-table").className = ""
        document.querySelector(".page-tr").className = ""
        p.innerHTML += "<div class='page-border'><div class='page'><table class='page-table'><tr class='page-tr'></tr></table></div></div>"
    }
}

/*----------------------------------------------------------------*/
//                        Barcode count                           //
/*----------------------------------------------------------------*/

//keep track of created barcodes for lols
function barcodeCount (x) {
    var bTotalCount = document.querySelector("#barcode_count_total")
    var count = localStorage.getItem("barcodeCountTotal");
    
    if (!count) {
        console.log("Resetting count, non saved")
        localStorage.setItem("barcodeCountTotal", 0)
    }

    if (x==0) {
        console.log("---- Initializing barcode counter 2000 -----");
        bTotalCount.innerHTML = localStorage.getItem("barcodeCountTotal") + " stregkoder genereret"
    }
    if (x>0) {
        localStorage.setItem("barcodeCountTotal", Number(localStorage.getItem("barcodeCountTotal"))+x)
        bTotalCount.innerHTML = localStorage.getItem("barcodeCountTotal") + " stregkoder genereret"
    }
}

/*----------------------------------------------------------------*/
//                 Activate layout settings                       //
/*----------------------------------------------------------------*/

//handle activating the settings for injected CSS and save the current values to localStorage
function activateSettings () {
    var cStyle = document.querySelector("#cStyle");
    var inputs = document.querySelectorAll("#styleSettings input")

    //paddingSetting
    var paddingE = document.querySelectorAll(".paddingSetting")
    var pxSetting = document.querySelectorAll(".pxSetting")
    for(var i=0;i<pxSetting.length;i++) {
        if(!pxSetting[i].value.includes("px")) {//add "px" to html if not existent
            pxSetting[i].value = pxSetting[i].value+"px";
        }
        if(pxSetting[i].className.includes("paddingSetting") && pxSetting[i] != "extraTextSize") {
            cStyle.innerHTML += "#png-container svg {"+pxSetting[i].id+": " + pxSetting[i].value + ";}";
        }
        if (pxSetting[i].id == "extraTextSize") {
            cStyle.innerHTML += ".barcode_subtitle {font-size:"+pxSetting[i].value+";}"
        }
    }

    // save settings to localStorage
    var settingsAr = [] // [["id", "value"], ["id", "value"]]
    for(var i=0;i<inputs.length;i++) {
        var n = [inputs[i].id, inputs[i].className == "checkbox" ? inputs[i].checked : inputs[i].value]
        settingsAr.push(n);
    }
    //console.log(JSON.stringify(settingsAr));
    localStorage.setItem("settings", JSON.stringify(settingsAr))
    //save settings

    //center barcodes
    var centerEl = document.querySelector("#styleCenterBarcodes");
    if(!centerEl.checked) {
        cStyle.innerHTML += "#png-container table {margin:initial;}";
    } else {
        cStyle.innerHTML += "#png-container table {margin:auto;}";
    }

    //barcode border
    var tableBorder = document.querySelector("#borderBarcode")
    if (tableBorder.checked) {
        cStyle.innerHTML += "#png-container table, #png-container td {border: 1px solid black;border-collapse: collapse;}"
    } else {
        cStyle.innerHTML += "#png-container table, #png-container td {border: none;}"
    }
}

//update the DOM content in correlation to localStorage
function updateSettings () {
    var ar = JSON.parse(localStorage.getItem("settings"))
    //console.log(ar)
    //go through settings ar and update value/checked accordingly
    if(ar) {
        for(var i=0;i<ar.length;i++) {
            if(typeof ar[i][1] == "string") {console.log(ar[i][0])
                document.querySelector("#"+ar[i][0]).value = ar[i][1]
            } else {
                document.querySelector("#"+ar[i][0]).checked = ar[i][1]
            }
            
        }
    } else {
        console.error("No array saved in localStorage for style settings, resetting.")
        resetSettings()
    }
    activateSettings()
}
//[["padding-bottom","6px"],["padding-top","6px"],["padding-left","6px"],["padding-right","8px"],["styleCenterBarcodes",true],["barcodeRow",true],["barcodePerPage",true],["borderBarcode",true]]

function resetSettings () {
    var reset = [
        ["padding-bottom","6px"],
        ["padding-top","6px"],
        ["padding-left","6px"],
        ["padding-right","6px"],
        ["extraTextSize","40px"],
        ["styleCenterBarcodes",true],
        ["barcodeRow",true],
        ["barcodePerPage",true],
        ["borderBarcode",false]
    ]
    localStorage.setItem("settings", JSON.stringify(reset))
    updateSettings()
    document.querySelector("#submit").click();
}

document.querySelector("#styleSettings").addEventListener("click", function (e) {
    activateSettings()
});

document.querySelector("#submitStyle").addEventListener("click", function (r) {
    document.querySelector("#submit").click();
})

document.querySelector("#resetSettings").addEventListener("click", function (r) {
    resetSettings();
})

/*----------------------------------------------------------------*/
//                     Preset barcode sizes                       //
/*----------------------------------------------------------------*/

//handle changing option and update values for DOM content and localStorage settings
document.querySelector("#presetSize").addEventListener("change", function (e) {
    var p = document.querySelector("#presetSize");
    var h = document.querySelector("#barcode_height");
    var w = document.querySelector("#barcode_width");
    var fS = document.querySelector("#barcode_fontSize");
    
    var standard = {
        "Luftplacering": [400, 10, 400],
        "Plukplacering": [300, 8, 250],
        "Varestregkode": [200, 5, 200],
        "Mindre": [100, 4, 80]
    }

    var sizeArray = JSON.parse(localStorage.getItem("sizeArray"))
    
    //if no localStorage, reset settings
    if (!sizeArray || !sizeArray.Luftplacering || !sizeArray.Plukplacering || !sizeArray.Varestregkode || !sizeArray.Mindre) {
        sizeArray = standard;
    }
    
    switch(p.value) {
        case "Luftplacering":
            h.value=sizeArray.Luftplacering[0];
            w.value=sizeArray.Luftplacering[1];
            fS.value=sizeArray.Luftplacering[2];
            break;
        case "Plukplacering":
            h.value=sizeArray.Plukplacering[0]
            w.value=sizeArray.Plukplacering[1]
            fS.value=sizeArray.Plukplacering[2]
            break;
        case "Varestregkode":
            h.value=sizeArray.Varestregkode[0]
            w.value=sizeArray.Varestregkode[1]
            fS.value=sizeArray.Varestregkode[2]
            break;
        case "Mindre":
            h.value=sizeArray.Mindre[0]
            w.value=sizeArray.Mindre[1]
            fS.value=sizeArray.Mindre[2]
            break;
    }
})

//update settings
document.querySelector("#sync_size").addEventListener("click", function (e) {
    var p = document.querySelector("#presetSize");
    var h = document.querySelector("#barcode_height");
    var w = document.querySelector("#barcode_width");
    var fS = document.querySelector("#barcode_fontSize");

    var sizeArray = JSON.parse(localStorage.getItem("sizeArray"))

    if (!sizeArray || !sizeArray.Luftplacering || !sizeArray.Plukplacering || !sizeArray.Varestregkode || !sizeArray.Mindre) {
        sizeArray = {
            "Luftplacering": [400, 10, 400],
            "Plukplacering": [300, 8, 250],
            "Varestregkode": [200, 5, 200],
            "Mindre": [100, 4, 80]
        }
    }
    console.log(sizeArray)

    switch(p.value) {
        case "Luftplacering":
            sizeArray.Luftplacering[0] = h.value
            sizeArray.Luftplacering[1] = w.value
            sizeArray.Luftplacering[2] = fS.value
            break;
        case "Plukplacering":
            sizeArray.Plukplacering[0] = h.value
            sizeArray.Plukplacering[1] = w.value
            sizeArray.Plukplacering[2] = fS.value
            break;
        case "Varestregkode":
            sizeArray.Varestregkode[0] = h.value
            sizeArray.Varestregkode[1] = w.value
            sizeArray.Varestregkode[2] = fS.value
            break;
        case "Mindre":
            sizeArray.Mindre[0] = h.value
            sizeArray.Mindre[1] = w.value
            sizeArray.Mindre[2] = fS.value
            break;
    }
    localStorage.setItem("sizeArray", JSON.stringify(sizeArray))
})

/*----------------------------------------------------------------*/
//                  Add txt to digit x barcode                    //
/*----------------------------------------------------------------*/

function initializeTxtBtn () {
    var buttons = document.querySelectorAll(".buttonText")
    var trashB = document.querySelectorAll(".trash_digit")
    var table = document.querySelector("#txtButtonTbody")

    buttons.forEach(function (r, i) {
        buttons[i].addEventListener("click", function (e) {console.log(e.path[0].id)
            var classN = e.path[0].id
            var nDigit = Number(classN.replace(/\D+/g, ""))
            
            openDialog(nDigit, classN)
        })
    })

    trashB.forEach(function (r, i) {
        trashB[i].addEventListener("click", function (e) {
            var classN = e.path[0].id
            var nDigit = Number(classN.replace(/\D+/g, ""))
            
            resetTextForNumbers(nDigit)
        })
    })

    document.querySelector("#closeDialog").addEventListener("click", closeDialog)

    document.querySelector("#dialogMarkAll").addEventListener("click", markAll)

    document.querySelector("#addTextToMarked").addEventListener("click", addTextToAll)

    table.addEventListener("keyup", saveSettings)

    document.querySelector("#addTextToMarked").addEventListener("click", saveSettings)

    document.querySelector("#dialogSearch").addEventListener("keyup", searchList)
}
/*
[
    [
        0 (position in html, 00-x-00 etc.), 
        [
            {"n":(actual number), "i":(placement in list), "text": (text to be added)},
            {"n":(actual number), "i":(placement in list), "text": (text to be added)},
            ...
        ]
    ],
    [
        1 (position in html, 00-x-00 etc.), 
        [
            {"n":(actual number), "i":(placement in list), "text": (text to be added)},
            {"n":(actual number), "i":(placement in list), "text": (text to be added)},
            ...
        ]
    ],
]
*/

function openDialog (nDigit, classN) {    
    console.log("opening digit - ", nDigit)
    //reveal box and add background blur
    //reset array manually 
    document.querySelector("#txtButtonTbody").dataset.group = nDigit;
    cStyle.innerHTML +=".dialogContainer {backdrop-filter: blur(4px); display:initial !important;} #txtButtonDialog {display:initial !important;}"

    var table = document.querySelector("#txtButtonTbody")

    wipeDialogTable()
    var index = textForNumbers_f_index()
    var dMin = document.querySelector("#f_digit_"+nDigit).value
    var dMax = document.querySelector("#t_digit_"+nDigit).value
    var add0 = document.querySelector("#barcode_include0_"+nDigit).checked

    console.log("---------- ",index[0][1])
    var x = 0;
    for (var i=dMin;i<=dMax;i++) {
        if(add0 == true && i.toString().length == 1) {
            i = "0" + i.toString()
        }
        if(index[0][1] == "new") {
            textForNumbers[index[0][0]][1].push({"n": i.toString(), "i": x.toString(), "text": ""})
            addLine(i,x)
        } else {
            addLine(i,x, textForNumbers[index[0][0]][1][x]["text"])
        }

        x+=1;
    }

    function addLine (i, x, text="") {
        var tr = document.createElement("tr");
            tr.dataset.i = x;
            tr.innerHTML = "<td><input class='"+i+"' type='checkbox'></td><td>"+i+"</td><td><input value='"+text+"'></td>";
            table.appendChild(tr);
    }

}

function searchList () {
    var index = textForNumbers_f_index()
    var table = document.querySelector("#txtButtonTbody")
    wipeDialogTable()
    var key = document.querySelector("#dialogSearch").value

    for (var i=0;i<textForNumbers[index[0][0]][1].length;i++) {
        var x = textForNumbers[index[0][0]][1][i]
        console.log(x)
        if (x["n"].includes(key) || key == "") {
            var tr = document.createElement("tr");
            tr.dataset.i = x['i']
            tr.innerHTML = "<td><input class='"+x['i']+"' type='checkbox'></td><td>"+x['n']+"</td><td><input value='"+x['text']+"'></td>";
            table.appendChild(tr);
        }
    }
    if(tr.length -1 == 0) {
        fMSG(["Intet at markeret", "Der er intet at markere på listen. Prøv at ændre dit søgning."], "warn", 5000)
    }
}

function markAll () {
    var tr = document.querySelectorAll("#txtButtonTbody tr");
    for (var i=1;i<tr.length;i++) {
        tr[i].children[0].children[0].checked = true;
    }
    if(tr.length -1 == 0) {
        fMSG(["Intet at markeret", "Der er intet at markere på listen. Prøv at ændre dit søgning."], "warn", 5000)
    }
}



function addTextToAll () {
    var tr = document.querySelectorAll("#txtButtonTbody tr");
    var text = document.querySelector("#textMarked").value;
    var notChecked = 0;
    for (var i=1;i<tr.length;i++) {
        if(tr[i].children[0].children[0].checked) {
            tr[i].children[2].children[0].value = text;
        } else {
            notChecked += 1
        }
    }
    console.log(notChecked, tr.length)
    if (notChecked == tr.length-1) {
        fMSG(["Intet markeret", "Du har ikke markeret nogle bokse"], "warn", 5000)
    } else {
        saveSettings();
    }
    
}

function closeDialog () {
    cStyle.innerHTML += ".dialogContainer {display:none !important;} #txtButtonDialog {display:none !important;}"
}

function wipeDialogTable () {
    var table = document.querySelector("#txtButtonTbody")
    
    if (table.length > 1 ) {saveSettings()}

    table.querySelectorAll("tr").forEach(function (r, i) {
        if(!r.querySelector("th")) {
            r.remove()
        }
        
    })
}

function saveSettings () {
    console.log(textForNumbers)

    var index = textForNumbers_f_index()
    
    var tr = document.querySelectorAll("#txtButtonTbody tr");
    var group = document.querySelector("#txtButtonTbody").dataset.group
    if(index[0][1] != "new") {
        for (var i=1;i<tr.length;i++) {
            if (textForNumbers[index[0][0]][1]) {
                textForNumbers[index[0][0]][1][tr[i].dataset.i]["text"] = tr[i].children[2].children[0].value;
            }
        }
    }
    
    console.log(textForNumbers)
}

function textForNumbers_f_index () {
    var index = [[],[false]]
    var nDigit = Number(document.querySelector("#txtButtonTbody").dataset.group)

    
    textForNumbers.forEach(function(r, i) {//console.log(textForNumbers)
        if(r[0] == nDigit) {
            index[0][1] = true
            index[0][0] = i
        }
    })
    if (!index[0][1]) {
        console.warn("No array found, creating a new array")
        textForNumbers.push([nDigit, []])
        index[0][0] = textForNumbers.length - 1
        index[0][1] = "new"
        //creates array but doesnt create values, thus 
    }

    if (!index && index[0][0] != 0) {console.error("Couldn't find index", index)}
    return index
}

function resetTextForNumbers(nDigit) {
    if (nDigit == "all") {
        textForNumbers = []
    } else {
        textForNumbers.forEach(function(r, i) {
            if(r[0] == nDigit) {
                textForNumbers.splice(i, 1)
                console.log("Removed array: " + r + " Array now: ", textForNumbers)
            }
        })
    }
}