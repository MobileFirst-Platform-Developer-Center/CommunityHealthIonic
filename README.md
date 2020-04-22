# Community-Health-Demo
This repository holds the latest version of the Community Health demo for showcasing the value of IBM MobileFirst Foundation.  This is typically best used in an introductory presentation / demo designed to highlight the many features of MobileFirst Foundation to people who want to know more.  The sweet-spot audience for this demo are slightly higher level than developers, although it can work for development audiences as well, as a way to show how MobileFirst Foundation can help them with the parts of mobile development that they don't like anyway!

Also included in this repository is a presentation deck that be effectively used as an introduction.  You can find a recording the pitch here: [https://www.youtube.com/watch?v=MNK9anM8UEk](), along with a recording of how to give this demo here: [https://www.youtube.com/watch?v=lZYZ8ooO3y4]()

PAH 09-26-17:  This codebase has been successfully migrated to run on Ionic 3.12.0 - but it's still a work-in-progress. The CSS files for the various pages are still not 100%, so if there are any Ionic/CSS/Sass experts out there, I welcome your input! 

**To get this demo up and running:**

1. Download and install a local copy of the IBM MobileFirst Foundation DevKit ([https://mobilefirstplatform.ibmcloud.com/downloads/]() -- preferable because then you will have analytics automatically available), or create a new instance of the MobileFirst Foundation tile on Bluemix and start your server.
*  Download or clone this repository onto your machine
*  Install the dependencies by running `npm install` from the project root
*  Navigate into the `backend-services` folder and build and deploy the adapters by running the command `mvn install adapter:deploy`
*  Run the following commands to add the required MobileFirst Cordova plugins and prepare the Ionic hybrid app for the selected platforms:

	```bash
	cordova plugin add cordova-plugin-mfp
	cordova plugin add cordova-plugin-mfp-jsonstore
	cordova plugin add cordova-plugin-mfp-push
	cordova platform add (ios or android)
	cordova prepare
	mfpdev app register
	```
	
*  Navigate to the MobileFirst Operations Console on your running server and configure the Scope --> SecurityCheck mapping such that `accessRestricted` --> `UserLoginSecurityCheck`, and `accessRestricted_level2` --> `StepUpSecurityCheck`
*  While in the console, create a new push tag with ID `TEST-123`, and description `This tag allows you to subscribe to push notifications, so you will receive an alert when TEST-123 is ready`
*  Build the app with the command `ionic cordova build ios` or `ionic cordova build android`
*  Run the app in the simulator, on your device, etc. as you normally would!

**A few additional notes:**

* MQA has been deprecated and will no longer be a part of this demo application.
* You can log in with any credentials such that **the username is the same as the password**.  If you try to login with the username != the password, you will have be locked out after three wrong attempts.
* The part of the demo that showcases step-up authentication (i.e. when prescribing a new medication for the patient), will randomly ask you one of three secret security questions.  The questions / answers can be adjusted in `backend-services/AuthenicationAdapter/src/main/java/com/ibm/communityhealth/ChallengeQuestions.json`.  Make changes to that file and redeploy the adapter if you want to use your own questions.  Note that the answers, by default, are: Favourite teacher: Mrs. Smith, Mother's middle name: Rachel, first pet's name: Fido
* All the data is reset when you return to the login screen.  That allows you to go through the app the first time as the Doctor, then return to login, then go through again to talk about all the ways you just witnessed MobileFirst Foundation providing value without even realizing it.

**Some enhancements that I could use some help with, if you have time:**

* Want to add a use case for adapter configuration properties so that we can show them off in the Operations Console
* When subscribing to a push notification via the tag on the Test Results tab of the app, the list item does not automatically slide shut after the button is clicked, like it should.
