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
 * Assistant for the edit article scene.
 */
function EditArticleAssistant() {
};


/**
 * Model(s).
 */
EditArticleAssistant.prototype.menuModel = {
  items : [
    { label : "Cancel", command : "cancel" },
    { },
    { label : "Save", command : "save" }
  ]
};
EditArticleAssistant.prototype.editModel = { value : null };
    

/**
 * Set up the scene.
 */
EditArticleAssistant.prototype.setup = function() {

  // Set up Spinner for scrim.
  this.controller.setupWidget("editArticle_divSpinner",
    { spinnerSize : "large" }, { spinning : true }
  );

  // Set up command menu at the bottom.
  this.controller.setupWidget(Mojo.Menu.commandMenu, null, this.menuModel);
  this.controller.setupWidget("editArticle_txtText", 
    { focusMode : Mojo.Widget.focusSelectMode, multiline : true },
    this.editModel
  );

}; // End setup().


/**
 * Activate the scene.
 */
EditArticleAssistant.prototype.activate = function() {

  woswiki.getArticle(woswiki.currentArticle.title, woswiki.username, 
    function(inResponse) {
      if (woswiki.username == inResponse.lockedBy) {
        $("editArticle_divArticleTitle").innerHTML = inResponse.title;
        woswiki.currentArticle = inResponse;
        this.editModel.value = inResponse.articleText;
        this.controller.modelChanged(this.editModel);
      } else {
        Mojo.Controller.getAppController().showBanner({
          messageText : "Article locked by " + inResponse.lockedBy, 
          soundClass : "alerts"
        }, { }, "");
        this.controller.stageController.popScene();
      }
      $("editArticle_divScrim").hide();
    }.bind(this)
  );

}; // End activate().


/**
 * Handle command on the command menu.
 *
 * @param inEvent Incoming event object.
 */
EditArticleAssistant.prototype.handleCommand = function(inEvent) {

  if (inEvent.type == Mojo.Event.command) {
    switch (inEvent.command) {
      case "cancel":
        this.controller.stageController.popScene();
      break;
      case "save":
        $("editArticle_divScrim").show();
        woswiki.currentArticle.articleText = this.editModel.value;
        woswiki.updateArticle(
          function(inResponse) {
            if (inResponse.lockedBy != null) {
              Mojo.Controller.getAppController().showBanner({
                messageText : "Not saved, edit lock not yours" , 
                soundClass : "alerts"
              }, { }, "");              
            }
            woswiki.currentArticle = inResponse;
            this.controller.stageController.popScene();
          }.bind(this)
        );
      break;
    } // End switch.
  }

}; // End handleCommand().
