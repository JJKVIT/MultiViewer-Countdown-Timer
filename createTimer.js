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
        innerElement(weekend);
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

        let topEle = document.querySelector(".MuiPaper-root");
        let topEleheight = topEle.offsetHeight;

        let stickyElem = document.querySelector(".MuiButtonBase-root.MuiCardActionArea-root.css-147p5fy");
        stickyElem.style.backgroundColor = 'rgb(30, 30, 30)';

        let initialStickyPos = stickyElem.getBoundingClientRect().top + window.pageYOffset;
        console.log("initialStickyPos: ", initialStickyPos);
        let box = document.querySelector('.MuiCollapse-root.MuiCollapse-vertical.MuiCollapse-entered.css-c4sutr')
        let width = box.offsetWidth;
        stickyElem.style.width = width+'px';
        window.onresize = function(){
            width = box.offsetWidth;
            stickyElem.style.width = width+'px';
        }
        window.onscroll = function () {

            let currentScrollPos = window.pageYOffset;

            if (currentScrollPos > initialStickyPos) {
                stickyElem.style.position = "fixed";
                stickyElem.style.top = topEleheight+'px';
                stickyElem.style.zIndex = '1000'; 
                stickyElem.style.borderBottomLeftRadius = '5px';
                stickyElem.style.borderBottomRightRadius = '5px';
            } else {
                stickyElem.style.position = "relative"; 
                stickyElem.style.top = "auto";
            }
        }

        if (cardHeader && !cardHeader.querySelector('.timerDiv')) { 
            cardHeader.style.display = 'flex';
            cardHeader.style.position = 'sticky';
    
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
                let timeObj = convertToDateTime(weekendInfo.timeToStart);
                let timeLeftMillis = timeObj.getTime() - Date.now(); 
                innerAnchor = innerDiv.querySelector('a');
                if(!innerAnchor){
                    innerAnchor = document.createElement('a');
                    innerAnchor.addEventListener('click', function(event) {
                            console.log("finding");
                            event.stopPropagation();
                    });
                }
                innerAnchor.setAttribute('target','_blank');
                if(timeLeftMillis > 0){
                    const updateCountdown = () => {
                        if (timeLeftMillis <= 0) {
                            clearInterval(timerInterval);
                            timerInterval = null;
                            innerElement(weekend);
                        } else {
                            innerAnchor.textContent = `Live in ${formatCountdown(timeLeftMillis)} : ${weekendInfo.category} ${weekendInfo.eventName}`
                            innerAnchor.setAttribute('href',weekendInfo.link)
                            timeLeftMillis -= 1000;
                        }
                    };
                    timerInterval = setInterval(updateCountdown, 1000); 
                }
                else{
                    innerAnchor.textContent = `Live: ${weekendInfo.category} ${weekendInfo.eventName}`
                    innerAnchor.setAttribute('href',weekendInfo.link)
                }
                if(weekendInfo.category == "F1" && !(weekendInfo.eventName.includes("Pre" || "Post"))){
                    innerAnchor.setAttribute('target','');
                }
                innerDiv.innerText = "";
                innerDiv.appendChild(innerAnchor);
            
                innerDiv.onclick = function(e) {m
                    e.stopPropagation();
                    var anchor = innerDiv.querySelector('a');
                    if(anchor) {
                        anchor.click();
                    }
                };
                
                console.log("time left: ",weekendInfo.timeLeft);
                if(weekendInfo.timeLeft > 0){
                    setTimeout(()=>{
                        console.log("observer set",weekend.querySelector('.MuiList-root.css-1uzmcsd'));
                        weekendObserver.observe(weekend.querySelector('.MuiList-root.css-1uzmcsd'), {characterData: true, attributes: true, subtree: true, childList: true });

        
                    }, weekendInfo.timeLeft);
                }
                else{
                    console.log("observer set",weekend.querySelector('.MuiList-root.css-1uzmcsd'));
                    weekendObserver.observe(weekend.querySelector('.MuiList-root.css-1uzmcsd'), {characterData: true, attributes: true, subtree: true, childList: true });
                }
                console.log("timeoutset");
            }
            
        }
        else if(weekendInfo.status == "UPCOMING"){
    
            const timeObj = convertToDateTime(weekendInfo.timeStr);
            weekendObserver.observe(weekend.querySelector('.MuiList-root.css-1uzmcsd'), {characterData: true, attributes: true, subtree: true, childList: true });
    
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
    
                const status = {
                    "status": statusText,
                    "category": categoryText,
                    "eventName": eventNameText,
                };
                
                console.log(status.status);
                if(status.status === "UPCOMING"){
                    status.timeStr = child.children[2].innerText;
                    return status;
                }
                else if(status.status === "WATCH LIVE"){
                    const anchor = child.children[3].querySelector('a');
                    status.link = anchor?anchor.href:null;
                    status.timeLeft = getTimeRemaining(child.children[2].innerText);
                    status.timeToStart = child.children[2].innerText;

                    i++
                    let nextElement = statusDiv.children[i];
                    while(nextElement && nextElement.children[3].innerText === "WATCH LIVE"){
                        status.category = nextElement.children[0].innerText;
                        status.eventName = nextElement.children[1].innerText;
                        const nextAnchor = nextElement.children[3].querySelector('a');
                        status.link = nextAnchor?nextAnchor.href:null;
                        status.timeLeft = getTimeRemaining(nextElement.children[2].innerText);
                        i++;
                        nextElement = statusDiv.children[i];
                    }
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
    const endStr = (timeStr.split('–')[1]);
    const now = new Date();

    const endDate = new Date(endStr +" " + now.getFullYear());
    endDate.setDate(now.getDate());
    endDate.setMonth(new Date().getMonth());

    return (endDate.getTime() - now.getTime());
}