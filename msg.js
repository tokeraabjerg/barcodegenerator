function fMSG (arr, status, timeout) {
    console.log(arr, status, timeout);
    if(!arr[0] && !arr[1]) {console.error("Invalid output for MSG box."); return;}
    if(!status) {status="msg"; console.warn("Parameter 'status' in fMSG was undefined. Assuming it was a regular msg.")}
    if(typeof timeout == "number" && timeout != undefined) {
      if(typeof timeout == "str") {
        console.error("Expecting integer, got string @fMSG")
        return;
      }
    }

    //build list element if first time around
    if(!document.querySelector("#msg_list")) {
      var ls = document.createElement("div");
          ls.id="msg_list";
          document.body.appendChild(ls);
    }

    var container = document.createElement("div");
        container.className = "msg_container no-show";
        //container.className = "no-show"
        document.querySelector("#msg_list").appendChild(container);

    var title = document.createElement("div");
        title.className="msg_title";
        container.appendChild(title);

    var sub = document.createElement("div");
        sub.className = "msg_sub";
        container.appendChild(sub);

    var close = document.createElement("div");
        close.className="msg_close";
        close.innerHTML = '<i class="fas fa-times"></i>';

        close.addEventListener("click", function (e) {
          /*e.toElement.parentElement.parentElement.className = "msg_container no-show"
          setTimeout(function(){
            e.toElement.parentElement.parentElement.remove()
          }, 1100)
          */
         closeMSG (); 
        });
        container.appendChild(close);

    var msg = document.createElement("div");
        msg.id="msg_msg";
        container.appendChild(msg);

    var b_ok = document.createElement("div");
        b_ok.id="msg_b_ok";
        container.appendChild(b_ok);

    var bar = document.createElement("div");
        bar.className = "msg_bar";
        container.appendChild(bar);

    
    
    //!    ----  Finish the msg and show it  ----
    
    
    container.querySelector(".msg_title").innerHTML = arr[0];
    container.querySelector(".msg_sub").innerHTML = arr[1];
  
    var h = container.querySelector(".msg_sub").clientHeight + container.querySelector(".msg_title").clientHeight;
  
    container.style = "height:" + (h + 20) + "px";
  
    switch (status) {
      case "msg":
        container.querySelector(".msg_bar").className += " msg"
        break;

        case "ok":
          container.querySelector(".msg_bar").className += " ok"
          break;

          case "warn":
            container.querySelector(".msg_bar").className += " warn"
            break;

            case "error":
              container.querySelector(".msg_bar").className += " error"
              break;
  
    }
    
    container.className = "msg_container show";

    //timeout if any
    if(timeout) {
      setTimeout(function(){
        closeMSG (); 
      },timeout)
    }

    function closeMSG () {
      container.className = "msg_container no-show"  
      setTimeout(function(){
        container.remove()
      }, 1100)
    }
  }