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
 * Assistant for the view article scene.
 */
function ViewArticleAssistant() {
};


/**
 * Model(s).
 */
ViewArticleAssistant.prototype.menuModel = {
  items : [
    { label : "Home", command : "home" },
		{ },
    { label : "Edit", command : "edit" }
  ]
};
    

/**
 * Set up the scene.
 */
ViewArticleAssistant.prototype.setup = function() {

  // Set up Spinner for scrim.
  this.controller.setupWidget("viewArticle_divSpinner",
    { spinnerSize : "large" }, { spinning : true }
  );

  // Set up command menu at the bottom.
  this.controller.setupWidget(Mojo.Menu.commandMenu, null, this.menuModel);

}; // End setup().


/**
 * Activate the scene.
 */
ViewArticleAssistant.prototype.activate = function() {

  // Get the "home" article.
  if (woswiki.currentArticle == null) {
    woswiki.getArticle("home", null,
		  function(inResponse) {     
        woswiki.currentArticle = inResponse;
        $("viewArticle_divArticleTitle").innerHTML = inResponse.title;
        $("viewArticle_divArticle").innerHTML = 
          woswiki.activateLinks(inResponse.articleText);
        $("viewArticle_divScrim").hide();
      }
	  );
  } else {
    $("viewArticle_divArticle").innerHTML = 
      woswiki.activateLinks(woswiki.currentArticle.articleText);
  }

}; // End activate().


/**
 * Handle command on the command menu.
 *
 * @param inEvent Incoming event object.
 */
ViewArticleAssistant.prototype.handleCommand = function(inEvent) {

  if (inEvent.type == Mojo.Event.command) {
    switch (inEvent.command) {
      case "home":
        woswiki.currentArticle = null;
        $("viewArticle_divScrim").show();
				this.activate();			
			break;
      case "edit":
        Mojo.Controller.stageController.pushScene("editArticle");
      break;
    } // End switch.
  }

}; // End handleCommand().
