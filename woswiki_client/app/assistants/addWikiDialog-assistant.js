/*
    webOS Wiki
    Copyright (C) 2010 Frank W. Zammetti
    fzammetti@etherient.com

    Licensed under the terms of the MIT license as follows:

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to
    deal in the Software without restriction, including without limitation the
    rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.
*/


/**
 * Assistant for the addWiki dialog.
 */
function AddWikiDialogAssistant(inParentAssistant) {

  this.parentAssistant = inParentAssistant;

  this.saveTapBind = this.saveTap.bind(this);
  this.cancelTapBind = this.cancelTap.bind(this);
  this.validationSuccessBind = this.validationSuccess.bind(this);
  this.validationProblemBind = this.validationProblem.bind(this);
  this.on0HandlerBind = this.on0Handler.bind(this);
  this.getArticlesBind = this.getArticles.bind(this);

};


/**
 * Reference to the assistant of the parent scene.
 */
AddWikiDialogAssistant.prototype.parentAssistant = null;


/**
 * References to binds.
 */
AddWikiDialogAssistant.prototype.saveTapBind = null;
AddWikiDialogAssistant.prototype.cancelTapBind = null;
AddWikiDialogAssistant.prototype.validationSuccessBind = null;
AddWikiDialogAssistant.prototype.validationProblemBind = null;
AddWikiDialogAssistant.prototype.on0HandlerBind = null;
AddWikiDialogAssistant.prototype.getArticlesBind = null;


/**
 * Model(s).
 */
AddWikiDialogAssistant.prototype.txtWikiTitleModel = { value : null };
AddWikiDialogAssistant.prototype.txtWikiURLModel = { value : null };
AddWikiDialogAssistant.prototype.txtUsernameModel = { value : null };
AddWikiDialogAssistant.prototype.txtPasswordModel = { value : null };
AddWikiDialogAssistant.prototype.btnSaveModel = { 
  disabled : false, label : "Save", buttonClass : "affirmative" 
};
AddWikiDialogAssistant.prototype.btnCancelModel = { 
  disabled : false, label : "Cancel", buttonClass : "negative" 
};
  

/**
 * Set up the scene.
 */
AddWikiDialogAssistant.prototype.setup = function() {

  // Set up textfields.
  this.parentAssistant.controller.setupWidget("addWiki_txtTitle", 
    { focusMode : Mojo.Widget.focusSelectMode, 
      textCase : Mojo.Widget.steModeLowerCase },
    this.txtWikiTitleModel
  );
  this.parentAssistant.controller.setupWidget("addWiki_txtURL", 
    { focusMode : Mojo.Widget.focusSelectMode,
      textCase : Mojo.Widget.steModeLowerCase },
    this.txtWikiURLModel
  );
  this.parentAssistant.controller.setupWidget("addWiki_txtUsername", 
    { focusMode : Mojo.Widget.focusSelectMode,
      textCase : Mojo.Widget.steModeLowerCase },
    this.txtUsernameModel
  );
  this.parentAssistant.controller.setupWidget("addWiki_txtPassword", 
    { focusMode : Mojo.Widget.focusSelectMode,
      textCase : Mojo.Widget.steModeLowerCase },
    this.txtPasswordModel
  );  

  // Set up buttons.
  this.parentAssistant.controller.setupWidget("addWiki_btnSave", 
    { type : Mojo.Widget.activityButton }, this.btnSaveModel
  );
  this.parentAssistant.controller.setupWidget("addWiki_btnCancel", 
    { }, this.btnCancelModel
  );  

}; // End setup().


/**
 * Activate the scene.
 */
AddWikiDialogAssistant.prototype.activate = function() {

  // Bind event handlers.
  this.parentAssistant.controller.listen("addWiki_btnSave", Mojo.Event.tap,
    this.saveTapBind);
  this.parentAssistant.controller.listen("addWiki_btnCancel", Mojo.Event.tap,
    this.cancelTapBind);

  // Reset the button, just in case the user aborted a previous add.
  this.btnSaveModel.label = "Save";
  this.btnSaveModel.disabled = false;
  this.parentAssistant.controller.modelChanged(this.btnSaveModel);
  this.parentAssistant.controller.get(
    "addWiki_btnSave").mojo.deactivate();

}; // End activate().


/**
 * Deactivate the scene.
 */
AddWikiDialogAssistant.prototype.deactivate = function() {

  // Stop listening for events.
  this.parentAssistant.controller.stopListening("addWiki_btnSave", 
   Mojo.Event.tap, this.saveTapBind);
  this.parentAssistant.controller.stopListening("addWiki_btnCancel", 
   Mojo.Event.tap, this.cancelTapBind);

}; // End deactivate().


/**
 * Tap event handler for the Save button.
 */
AddWikiDialogAssistant.prototype.saveTap = function(inEvent) {

  var wikiTitle = this.txtWikiTitleModel.value;
	var wikiURL = this.txtWikiURLModel.value;
  var username = this.txtUsernameModel.value;
  var password = this.txtPasswordModel.value;

  // Make sure they entered a title, URL, username and password.
	if (wikiTitle == null || wikiTitle.blank()) {
    Mojo.Controller.getAppController().showBanner({
      messageText : "Please enter a title", 
      soundClass : "alerts"
    }, { }, "");
		// Deactivate spinner, since the tap automatically activates it.
		this.parentAssistant.controller.get("addWiki_btnSave").mojo.deactivate();
		return;
  }
  if (wikiURL == null || wikiURL.blank()) {
    Mojo.Controller.getAppController().showBanner({
      messageText : "Please enter a URL", 
      soundClass : "alerts"
    }, { }, "");
		// Deactivate spinner, since the tap automatically activates it.
		this.parentAssistant.controller.get("addWiki_btnSave").mojo.deactivate();
		return;
  }
  if (username == null || username.blank()) {
    Mojo.Controller.getAppController().showBanner({
      messageText : "Please enter a username", 
      soundClass : "alerts"
    }, { }, "");
    // Deactivate spinner, since the tap automatically activates it.
    this.parentAssistant.controller.get("addWiki_btnSave").mojo.deactivate();
    return;
  }
  if (password == null || password.blank()) {
    Mojo.Controller.getAppController().showBanner({
      messageText : "Please enter a password", 
      soundClass : "alerts"
    }, { }, "");
    // Deactivate spinner, since the tap automatically activates it.
    this.parentAssistant.controller.get("addWiki_btnSave").mojo.deactivate();
    return;
  }

  // Put spinner on Save button and disable Cancel button.
  this.btnSaveModel.label = "Working...";
  this.btnSaveModel.disabled = true;
  this.parentAssistant.controller.modelChanged(this.btnSaveModel);
  this.btnCancelModel.disabled = true;
  this.parentAssistant.controller.modelChanged(this.btnCancelModel);

  // Now "validate" the wiki.  All this means is using the REST interface
  // to see if there's a wiki there and is the correct version.
  if (wikiURL.indexOf("http://") == -1) {
    wikiURL = "http://" + wikiURL;
  }
  if (wikiURL.charAt(wikiURL.length - 1) == "/") {
    wikiURL = wikiURL.substr(wikiURL, wikiURL.length - 1);
  }
  this.txtWikiURLModel.value = wikiURL;
  this.parentAssistant.controller.modelChanged(this.txtWikiURLModel);
  new Ajax.Request(wikiURL + "/rest/woswiki", {
    method : "get",
    on0 : this.on0HandlerBind,
    onSuccess : this.validationSuccessBind,
    onException : this.validationProblemBind,
    onFailure : this.validationProblemBind
  }); 

}; // End saveTap().


/**
 * Handle on0 event for AJAX call.
 *
 * @param inTransport
 */
AddWikiDialogAssistant.prototype.on0Handler = function (inTransport) {

  this.btnSaveModel.label = "Save";
  this.btnSaveModel.disabled = false;
  this.parentAssistant.controller.modelChanged(this.btnSaveModel);
  this.btnCancelModel.disabled = false;
  this.parentAssistant.controller.modelChanged(this.btnCancelModel);
  this.parentAssistant.controller.get(
    "addWiki_btnSave").mojo.deactivate();
  Mojo.Controller.getAppController().showBanner({
    messageText : "Server unreachable", 
    soundClass : "alerts"
  }, { }, "");
  
}; // End on0Handler().
      

/**
 * Callback for the AJAX validateWiki REST call.
 * 
 * @param inTransport AJAX transport object.
 */
AddWikiDialogAssistant.prototype.validationSuccess = function(inTransport) {

  // Make sure there's a wiki there and that it's the appropriate version.
  if (inTransport.responseText && 
    inTransport.responseText.strip() == "woswiki_1.0") {

    // Now try to validate or create the user.
    new Ajax.Request(this.txtWikiURLModel.value + "/rest/user/" + 
      encodeURIComponent(this.txtUsernameModel.value), 
      {
        method : "post", 
        parameters : { password : this.txtPasswordModel.value }, 
        on0 : this.on0HandlerBind,
        onSuccess : this.getArticlesBind,
        onException : this.validationProblemBind,
        onFailure : this.validationProblemBind
      }
    ); 

  } else {
    // This shouldn't really happen, unless the server-side is upgraded, which
    // this version of woswiki won't handle, so we'll treat this as just a
    // generic validation failure.
    this.validationProblem(inTransport);
  }

}; // End validationSuccess().


/**
 * Callback method when the user validate/create REST call completes 
 * successfully.
 */
AddWikiDialogAssistant.prototype.getArticles = function(inTransport) {

  // Make sure the user was validated or created.
  if (inTransport.responseText && 
    inTransport.responseText.strip() == "ok") {

    // Point DWR classes to the wiki's URL.
    dwr.engine._defaultPath = this.txtWikiURLModel.value + "/dwr";
    WikiDelegate._path = this.txtWikiURLModel.value + "/dwr";
  
    // Retrieve all articles.  This is obviously a scalability bottleneck,
    // but should be fine for the purposes of this learning exercise (and
    // probably is OK for a reasonably small wiki too... but not much more!).
    // Note the default 5-second DWR call timeout is overridden to 2 minutes
    // here since this operation will almost certainly take longer than most
    // others.
    
    WikiDelegate.listAll(true, { 
      timeout : 1000 * 120,
      errorHandler : function(inMessage, inException) { }, 
      callback : function(inResponse) {
        // A single transaction for all of the following DB updates.
        var callbackCount = 0;
        woswiki.db.transaction(
          function (inTransaction) {
            // Create a record for the wiki itself.
            inTransaction.executeSql(
              "INSERT INTO wikis (title, url, username, password) " +
              "VALUES (?, ?, ?, ?); GO;",
              [ 
                this.txtWikiTitleModel.value, this.txtWikiURLModel.value,
                this.txtUsernameModel.value, this.txtPasswordModel.value 
              ], 
              function(inTransaction, inResultSet) {
                callbackCount = callbackCount + 1;
                if (callbackCount == (inResponse.length + 1)) {
                  this.finishAdd(); 
                }
              }.bind(this),
              woswiki.dbErrorHandler
            );
            // Add each article too, if any.
            for (var i = 0; i < inResponse.length; i++) {
              inTransaction.executeSql(
                "INSERT INTO wikiArticles (wiki, title, articleText, " +
                "lastEditedBy, lastEditedDateTime) " +
                "VALUES (?, ?, ?, ?, ?); GO;",
                [ this.txtWikiTitleModel.value, inResponse[i].title,
                  inResponse[i].articleText, inResponse[i].lastEditedBy,
                  inResponse[i].lastEditedDateTime 
                ], 
                function(inTransaction, inResultSet) {
                callbackCount = callbackCount + 1;
                  if (callbackCount == (inResponse.length + 1)) {
                    this.finishAdd(); 
                  }
                }.bind(this),
                woswiki.dbErrorHandler
              );
            }
          }.bind(this) /* End transaction function. */
        ); /* End transaction. */
      }.bind(this) /* End callback. */
    }); /* End listAll() call. */    

  } else {
  
    // Rest UI for another try.
    this.btnSaveModel.label = "Save";
    this.btnSaveModel.disabled = false;
    this.parentAssistant.controller.modelChanged(this.btnSaveModel);
    this.btnCancelModel.disabled = false;
    this.parentAssistant.controller.modelChanged(this.btnCancelModel);
    this.parentAssistant.controller.get("addWiki_btnSave").mojo.deactivate();  
  
    // Banner message to user.
    Mojo.Controller.getAppController().showBanner({
      messageText : "Login failed or name in use", 
      soundClass : "alerts"
    }, { }, "");
  }

}; // End getArticles().


/**
 * Called on validateWiki REST call failure or exeception.
 * 
 * @param inTransport AJAX transport object.
 */
AddWikiDialogAssistant.prototype.validationProblem = function(inTransport) {

  // Rest UI for another try.
  this.btnSaveModel.label = "Save";
  this.btnSaveModel.disabled = false;
  this.parentAssistant.controller.modelChanged(this.btnSaveModel);
  this.btnCancelModel.disabled = false;
  this.parentAssistant.controller.modelChanged(this.btnCancelModel);
  this.parentAssistant.controller.get("addWiki_btnSave").mojo.deactivate();
  
  // Banner message to user.
  Mojo.Controller.getAppController().showBanner({
    messageText : "No wiki found at specified URL", 
    soundClass : "alerts"
  }, { }, "");

}; // End validationProblem().


/**
 * Called when validationSuccess() is all done to close this dialog and 
 * update the List on the parent scene.  Note that the animation on the button 
 * is stopped to avoid a seemingly non-criticalerror showing up in the logs.
 */
AddWikiDialogAssistant.prototype.finishAdd = function() {

  this.parentAssistant.controller.get("addWiki_btnSave").mojo.deactivate();
  this.parentAssistant.addWikiDialog.mojo.close();
  this.parentAssistant.addWikiDialog = null;
  this.parentAssistant.updateList();

}; // End finishAdd().

 
/**
 * Tap event handler for the Cancel button.
 */
AddWikiDialogAssistant.prototype.cancelTap = function(inEvent) {

  this.finishAdd();

}; // End cancelTap().
