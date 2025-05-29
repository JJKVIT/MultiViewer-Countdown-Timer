document.addEventListener('DOMContentLoaded',()=>{
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
            weekendObserver.disconnect();
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
            weekendObserver.disconnect();
            console.log("Tabs changed!");
            innerElement(weekend);
            currentTab = tabTitle;
        }
    });
    
    const weekendObserver = new MutationObserver(()=>{
        console.log("Weekend element changed!");
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
                        // Cache this if it doesn't change frequently within this scope
                        let tabs = document.querySelector('.MuiTabs-flexContainer.css-k008qs'); 
                        let selectedTab = document.querySelector('.MuiButtonBase-root.MuiTab-root.MuiTab-textColorPrimary.Mui-selected.css-x0hk9u');
                        
                        if (tabs && selectedTab) {
                            currentTab = selectedTab.textContent;
                            tabsChangeObserver.observe(tabs, { subtree: true, childList: true });
                            createElement(weekend);
                        }
                    }
                }
                count++;
            }, 2000);
        }
    }
    
    async function createElement(weekend) {
        cardHeader = weekend.querySelector('.MuiCardHeader-content');
    
        if (cardHeader && !cardHeader.querySelector('.timerDiv')) { 
            cardHeader.style.display = 'flex';
            cardHeader.style.alignItems = 'center';
    
            newDiv = document.createElement('div');
            newDiv.classList.add('timerDiv'); 
            
            await innerElement(weekend);
            
            cardHeader.appendChild(newDiv);
            console.log("Custom element created and appended.");
        }
    }
    
    async function innerElement(weekend){
        console.log("updating element");
        let weekendInfo = await getLatest(weekend);    
    
        let innerDiv = newDiv ? newDiv.querySelector('.timer-div') : null; 
        if(!innerDiv){
            innerDiv = document.createElement('div');
            innerDiv.classList.add('timer-div');
    
            if (newDiv) {
                 newDiv.appendChild(innerDiv);
            }
        }
    
        if(timerInterval!=null){
            clearInterval(timerInterval);
            timerInterval = null;
        }
    
        newDiv.classList.remove("Live");
    
        if(weekendInfo.status == "WATCH LIVE"){
            console.log("Live");
            
            if(weekendInfo.link != null){
                newDiv.classList.add("Live");
        
                innerDiv.innerHTML = `<a href="${weekendInfo.link} " ${weekendInfo.category != "F1" || weekendInfo.eventName.includes(weekendInfo.category)?'target="_blank"':""} style="color: rgb(255,255,255); text-decoration: none; cursor: pointer">Live: ${weekendInfo.category} ${weekendInfo.eventName}</a>`;
                
                console.log("time left: ",weekendInfo.timeLeft);
                if(weekendInfo.timeLeft > 0){
                    setTimeout(()=>{
                        console.log(weekendInfo.div);
                        let l = weekendObserver.observe(weekendInfo.div, { subtree: true, childList: true }, weekendInfo.div);
                        console.log("l: ",l);
        
                        if(weekendInfo.div.innerText == "WATCH REPLAY" ){
                            weekendObserver.disconnect();
                            console.log("time left null");
                            innerElement(weekend);
                        }
        
                    }, weekendInfo.timeLeft);
                }
                else{
                    console.log("time left 0");
                    console.log(weekendInfo.div);
                    let l = weekendObserver.observe(weekendInfo.div, { subtree: true, childList: true }, weekendInfo.div);
                    console.log("l: ",l);
                }
                console.log("timeoutset");
                
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
    
    async function getLatest(){
        if (!weekend) return { "status": "Error: Weekend element not found" };
        const statusDiv = weekend.querySelector('.MuiList-root'); 
    
        if(statusDiv && statusDiv.children.length > 0){
            for(let i = 0; i < statusDiv.children.length; i++){
                const child = statusDiv.children[i];
                
                if (!child || child.children.length < 4) {return { "status": "Error: Couldnt Find child element" }};
    
                const categoryText = child.children[0].innerText;
                const eventNameText = child.children[1].innerText;
                const statusText = child.children[3].innerText;
                const childStatusDiv = child.children[3].querySelector('.MuiButtonBase-root');
    
                const status = {
                    "status": statusText,
                    "category": categoryText,
                    "eventName": eventNameText,
                    "div": childStatusDiv
                };
                
                console.log(status.status);
                if(status.status === "UPCOMING"){
                    status.timeStr = child.children[2].innerText;
                    return status;
                }
                else if(status.status === "WATCH LIVE"){
                    const anchor = child.children[3].querySelector('a');
                    status.link = anchor?anchor.href:null;
                    
                    if(!status.eventName.includes("Pre-")){
                        status.timeLeft = getTimeRemaining(child.children[2].innerText);
                        return status;
                    }
                    
                    const nextElement = statusDiv.children[i+1];
                    if(nextElement && nextElement.children.length > 3 && nextElement.children[3].innerText === "WATCH LIVE"){
                        status.eventName = nextElement.children[1].innerText;
                        const nextAnchor = nextElement.children[3].querySelector('a');
                        status.link = nextAnchor?nextAnchor.href:null;
                        status.timeLeft = getTimeRemaining(nextElement.children[2].innerText);
                        
                        return status;
                    }
                    
                    status.timeLeft = getTimeRemaining(child.children[2].innerText);
                    return status;
                }
            }
            return { "status": "Completed" };
        }
        return { "status": "Error Loading Data" };
    }
})

function convertToDateTime(timeStr){
    try {
        const part = (timeStr.split('–')[0]).replace(/,/g, "").trim();
        const currentYear = new Date().getFullYear();
        const datetime = new Date(part + " " + currentYear);
        return isNaN(datetime.getTime()) ? null : datetime;
    } catch (error) {
        console.error('Error parsing date:', timeStr, error);
        return null;
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

function getTimeRemaining(timeStr){
    const endStr = (timeStr.split('–')[1]).replace(/,/g, "");
    const now = new Date();
    const endDate = new Date(endStr);

    endDate.setDate(now.getDate());
    endDate.setMonth(now.getMonth());
    endDate.setFullYear(now.getFullYear());

    const endTime = endDate.getTime();

    return (endTime - now.getTime());
}

/*
MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorPrimary css-n9w9ys => loading bar maybe check if this is no longer in the doc instead
*/
