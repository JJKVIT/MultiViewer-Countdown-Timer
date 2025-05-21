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
        newDiv.style.height = '2.9vh'; 
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

    let innerDiv = document.querySelector('.timer-div');
    if(innerDiv==null){
        innerDiv = document.createElement('div');
        innerDiv.classList.add('timer-div');
        innerDiv.style.padding = '1vw';
        innerDiv.style.fontSize = '1.5vh';
        innerDiv.style.fontWeight = 'bold';
    }
    
    if(weekendInfo.status == "LIVE"){
        innerDiv.innerText = "Live: " + weekendInfo.category + " " + weekendInfo.eventName;
        innerDiv.style.color = 'rgb(255, 255, 255)';
        innerDiv.style.backgroundColor = 'rgb(255, 0, 0)';
    }   
    else if(weekendInfo.status == "UPCOMING"){
        const timeObj = convertToDateTime(weekendInfo.timeStr);
        timerInterval = setInterval(()=>{
            let currentTime = new Date();
            let timeLeft = timeObj.getTime() - currentTime.getTime();
            if(timeLeft<=0){
                clearInterval(timerInterval);
                timerInterval = null;
                innerElement(weekend);
                return;
            }
            innerDiv.innerText = weekendInfo.category +" "+ weekendInfo.eventName + ": " + formatCountdown(timeLeft);
        }, 1000);
    }
    else{
        innerDiv.innerText = weekendInfo.status;
    }
    
    newDiv.appendChild(innerDiv);
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
            else if(status.status == "Live"){
                status.eventName = statusDiv.children[i].children[1].innerText;
                status.link =  statusDiv.children[i].children[3].href;

                let nextElement = statusDiv.children[i+1]
                if(nextElement!=null && nextElement.children[3].innerText == "Live"){
                    status.eventName = nextElement.children[1].innerText;
                    status.link =  nextElement.children[3].href;
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