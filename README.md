# **CountDown Timer For _Multiviewer App_**(DOES NOT WORK.....REWORKING DUE TO UPDATE USES ASAR FILE)

## Description
This is a simple (100% overcomplicated and the worst implementation possible for this) modification that can be added to the multiviewer application that adds a countdown timer to visualize the upcoming events with a live button to access the live events. It also makes the weekend elements header sticky so as you scroll you can still see the timer or live button.
![image](https://github.com/user-attachments/assets/a6560af6-9b37-4e5f-8f6d-8856133b1201)
> [!NOTE]  
>There are some issues still, try refreshing if theres any issues regarding the timer or live button not working, or if it is displaying incorrect information.

Link to the [multiviewer application](https://multiviewer.app/)

## Installation
1. Download the index.html file and the createTimer.js file.
2. Navigate to appdata folder using 🪟+R and searching %localappdata%
> [!NOTE]  
> Not %appdata% as that sends you to the roaming file instead of the local file
   
   ![image](https://github.com/user-attachments/assets/33b5f9e9-60a8-465d-8853-6d2b9093156c)
   
4. Navigate to the latest app version in the multiviewer folder
   ![image](https://github.com/user-attachments/assets/d180bd99-3669-4970-b76b-741b62355235)
6. Inside the latest version folder navigate to app-[version number]\resources\app\.webpack\renderer\main_window
7. Copy paste the index.html and the createTimer.js file
8. Open multiviewer and enjoy 👍
> [!NOTE]  
> It currently only works when the time is set to 24hrs not 12hrs, may i'll add that later
