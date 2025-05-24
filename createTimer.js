let lastProcessedUrl = null;
let weekendInterval = null; 
let count = 0; 
let currentTab = null;
let newDiv = null;
let weekend = null;
let cardHeader = null;
let timerInterval = null;

const urlChangeObserver = new MutationObserver(()=>{
    if (lastProcessedUrl !== location.href) {
        tabsChangeObserver.disconnect();
        console.log("URL changed!");
        if (weekendInterval != null) {
            clearInterval(weekendInterval);
            weekendInterval = null;
            count = 0; 
        }
        if(cardHeader!=null && newDiv!=null){
            cardHeader.removeChild(newDiv);
            newDiv = null;
        }
        if(timerInterval!=null){
            clearInterval(timerInterval);
            timerInterval = null;
        }
        lastProcessedUrl = location.href; 
        findWeekend();
    }
});

urlChangeObserver.observe(document, { subtree: true, childList: true });

const tabsChangeObserver = new MutationObserver(()=>{
    let tabTitle =  (document.querySelector('.MuiButtonBase-root.MuiTab-root.MuiTab-textColorPrimary.Mui-selected.css-x0hk9u')).textContent;
    if(currentTab != tabTitle && currentTab!=null){
        if(timerInterval!=null){
            clearInterval(timerInterval);
            timerInterval = null;
        }
        console.log("Tabs changed!");
        innerElement(weekend);
        currentTab = tabTitle;
    }
});

function findWeekend() {

    if (weekendInterval === null) {
        count = 0;
        weekendInterval = setInterval(()=>{
            console.log("Checking for weekend element... Attempt:", count); 
            weekend = document.querySelector('.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1.MuiCard-root.css-1wou66g');
            if(weekend!=null || count>=5){ 
                console.log("Weekend element found!");
                clearInterval(weekendInterval);
                weekendInterval = null; 
                if (weekend != null) {
                    let tabs = document.querySelector('.MuiTabs-flexContainer.css-k008qs');
                    
                    currentTab = (document.querySelector('.MuiButtonBase-root.MuiTab-root.MuiTab-textColorPrimary.Mui-selected.css-x0hk9u')).textContent;
                    tabsChangeObserver.observe(tabs, { subtree: true, childList: true });
                    
                    createElement(weekend);
                }
            }
            count++;
        }, 2000);
    }
}

async function createElement(weekend) {
    cardHeader = weekend.querySelector('.MuiCardHeader-content');

    if (cardHeader && !cardHeader.querySelector('.custom-added-div')) { 
        cardHeader.style.display = 'flex';
        cardHeader.style.alignItems = 'center';

        newDiv = document.createElement('div');
        newDiv.classList.add('custom-added-div'); 

        newDiv.style.borderRadius = '3px';
        newDiv.style.marginLeft = '1rem';
        newDiv.style.backgroundColor = 'rgb(56, 56, 56)';
        newDiv.style.alignItems = 'center';
        newDiv.style.height = '2.5vh'; 
        newDiv.style.boxShadow = 'rgba(255, 255, 255, 0.4) 0px 0px 0px 1px inset';
        newDiv.style.justifyContent = 'center';
        newDiv.style.alignItems = 'center';
        newDiv.style.display = 'inline-flex';
        
        await innerElement(weekend);
        
        cardHeader.appendChild(newDiv);
        console.log("Custom element created and appended.");
    }
}

async function innerElement(weekend){
    console.log("updating element");
    let weekendInfo = await getLatest(weekend);    

    newDiv.style.boxShadow = 'rgba(255, 255, 255, 0.4) 0px 0px 0px 1px inset';
    newDiv.style.backgroundColor = 'rgb(56, 56, 56)';

    let innerDiv = document.querySelector('.timer-div');
    if(innerDiv==null){
        innerDiv = document.createElement('div');
        innerDiv.classList.add('timer-div');
        innerDiv.style.padding = '0.5vw';
        innerDiv.style.fontSize = '1.5vh';
        innerDiv.style.fontWeight = 'bold';
        innerDiv.style.fontFamily = 'Exo 2Variable';
        innerDiv.style.textTransform = 'uppercase';

        if (newDiv && !newDiv.contains(innerDiv)) {
             newDiv.appendChild(innerDiv);
        }
    }

    if(timerInterval!=null){
        clearInterval(timerInterval);
        timerInterval = null;
    }


    if(weekendInfo.status == "WATCH LIVE"){
        console.log("Live");
        innerDiv.innerHTML = `<a href="${weekendInfo.link} " target="_blank" style="color: rgb(255,255,255); text-decoration: none; cursor: pointer">Live: ${weekendInfo.category} ${weekendInfo.eventName}</a>`;
        innerDiv.style.color = 'rgb(255, 255, 255)';
        newDiv.style.boxShadow = 'rgba(255, 255, 255, 0) 0px 0px 0px 1px inset';
        // newDiv.style.on = 'rgb(180, 5, 0)'; 
        newDiv.style.backgroundColor = 'rgb(244, 67, 54)';
        
        var anchor = innerDiv.querySelector('a');
        if(anchor) {
            anchor.addEventListener('click', function(event) {
                event.stopPropagation();
            });
        }

        innerDiv.onclick = function(e) {
            e.stopPropagation();
            var anchor = innerDiv.querySelector('a');
            if(anchor) {
                anchor.click();
            }
        };
    }
    else if(weekendInfo.status == "UPCOMING"){

        const timeObj = convertToDateTime(weekendInfo.timeStr);

        if (timeObj === null || isNaN(timeObj.getTime())) {
             innerDiv.innerText = weekendInfo.category +" "+ weekendInfo.eventName + ": Invalid Time";
             console.error("Failed to parse upcoming event time:", weekendInfo.timeStr);
             return; 
        }

        let timeLeftMillis = timeObj.getTime() - Date.now(); 

        const updateCountdown = () => {
            if (timeLeftMillis <= 0) {
                innerDiv.innerText = weekendInfo.category +" "+ weekendInfo.eventName + ": Live!";
                clearInterval(timerInterval);
                timerInterval = null;
                innerElement(weekend);
            } else {
                innerDiv.innerText = weekendInfo.category +" "+ weekendInfo.eventName + ": " + formatCountdown(timeLeftMillis);
                timeLeftMillis -= 1000;
            }
        };
        timerInterval = setInterval(updateCountdown, 1000); 
    }
    else{
        innerDiv.innerText = weekendInfo.status;
    }   
}

function formatCountdown(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
    const pad = (num) => num < 10 ? '0' + num : num;
    if(days == 0){
        return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

async function getLatest(){
    let statusDiv = weekend.querySelector('.MuiList-root');

    if(statusDiv!=null){
        for(let i = 0; i<statusDiv.children.length; i++){
            let status = {
                "status" : statusDiv.children[i].children[3].innerText,
                "category" : statusDiv.children[i].children[0].innerText
            }
            console.log(status.status);
            if(status.status == "UPCOMING"){
                status.timeStr = statusDiv.children[i].children[2].innerText;
                status.eventName = statusDiv.children[i].children[1].innerText;

                return status;
            }
            else if(status.status == "WATCH LIVE"){
                status.eventName = statusDiv.children[i].children[1].innerText;
                status.link =  statusDiv.children[i].children[3].querySelector('a').href;

                let nextElement = statusDiv.children[i+1]
                if(nextElement!=null && nextElement.children[3].innerText == "WATCH LIVE"){
                    status.eventName = nextElement.children[1].innerText;
                    status.link =  nextElement.children[3].querySelector('a').href;
                    return status;
                }

                return status;
            }
            
        }
        return {
            "status" : "Completed"
        };
    }
    return {
        "status" : "Error Loading Data"
    };
}

function convertToDateTime(timeStr){
    const part = (timeStr.split('–')[0]).replaceAll(",","");
    const currentYear = new Date().getFullYear();
    const datetime = new Date(part + " " +currentYear);

    return datetime;
}