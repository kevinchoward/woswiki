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
 * Assistant for the wikiList scene.
 */
function WikiListAssistant() {

  this.wikiListTapBind = this.wikiListTap.bind(this);
  this.wikiListAddBind = this.wikiListAdd.bind(this);
	this.wikiListDeleteBind = this.wikiListDelete.bind(this);
 
};


/**
 * References to binds.
 */
WikiListAssistant.prototype.wikiListTapBind = null;
WikiListAssistant.prototype.wikiListAddBind = null;
WikiListAssistant.prototype.wikiListDeleteBind = null;


/**
 * Reference to the Add A Wiki dialog.
 */
WikiListAssistant.prototype.addWikiDialog = null;


/**
 * Model(s).
 */
WikiListAssistant.prototype.lstWikiListModel = { items : [ ] };
  

/**
 * Set up the scene.
 */
WikiListAssistant.prototype.setup = function() {

  // Set up wiki list.
  this.controller.setupWidget("wikiList_lstWiki", {
    itemTemplate : "wikiList/list-item", 
		addItemLabel : "Add...",
    swipeToDelete : true,		
  }, this.lstWikiListModel);

}; // End setup().


/**
 * Activate the scene.
 */
WikiListAssistant.prototype.activate = function() {

  // Clear out previous wiki, article and DWR mods.
  woswiki.currentWiki = null;
  woswiki.currentArticle = null;
  dwr.engine._defaultPath = null;
  WikiDelegate._path = null;

  // Listen for list events.
  this.controller.listen("wikiList_lstWiki", Mojo.Event.listTap, 
    this.wikiListTapBind
  );
  this.controller.listen("wikiList_lstWiki", Mojo.Event.listAdd, 
    this.wikiListAddBind
  );
  this.controller.listen("wikiList_lstWiki", Mojo.Event.listDelete, 
    this.wikiListDeleteBind
  );
 
  // Refresh the wiki list.
  this.updateList();

}; // End activate().


/**
 * Read in existing wikis from database and populate list.
 */
WikiListAssistant.prototype.updateList = function() {

  woswiki.db.transaction((
    function (inTransaction) { 
      inTransaction.executeSql(
        "SELECT * FROM wikis", 
        [ ],
        function (inTransaction, inResultSet) {
          // Update the list model.
          this.lstWikiListModel.items = [ ];
          for (var i = 0; i < inResultSet.rows.length; i++) {
            this.lstWikiListModel.items.push(inResultSet.rows.item(i));
          }
          // Inform the controller of the model change so the list is refreshed.
          this.controller.modelChanged(this.lstWikiListModel);
        }.bind(this),
        woswiki.dbErrorHandler
      ); 
    }.bind(this)
  )); 

}; // End updateList().


/**
 * Deactivate the scene.
 */
WikiListAssistant.prototype.deactivate = function() {

  // Stop listening for list events.
  this.controller.stopListening("wikiList_lstWiki", Mojo.Event.listTap, 
    this.wikiListTapBind
  );
  this.controller.stopListening("wikiList_lstWiki", Mojo.Event.listAdd, 
    this.wikiListAddBind
  );
  this.controller.stopListening("wikiList_lstWiki", Mojo.Event.listDelete, 
    this.wikiListDeleteBind
  );

}; // End deactivate().


/**
 * Called when an item in the list is tapped.
 * 
 * @param inEvent Incoming event object.
 */
WikiListAssistant.prototype.wikiListTap = function(inEvent) {

  // Override DWR paths to point to this wiki.
  dwr.engine._defaultPath = inEvent.item.url + "/dwr";
  WikiDelegate._path = inEvent.item.url + "/dwr";
  
  // Set other needed variables.
  woswiki.currentArticle = null;
	woswiki.currentWiki = inEvent.item.title;
  woswiki.username = inEvent.item.username;
  woswiki.password = inEvent.item.password;
  
  // Show the home article.
  Mojo.Controller.stageController.pushScene("viewArticle");
  
}; // End wikiListTap().


/**
 * Called when the user wants to add a new item to the list.
 * 
 * @param inEvent Incoming event object.
 */
WikiListAssistant.prototype.wikiListAdd = function(inEvent) {

  this.addWikiDialog = this.controller.showDialog({
    template : "wikiList/add-wiki-dialog", preventCancel : true, 
    assistant : new AddWikiDialogAssistant(this)
  });

}; // End wikiListAdd().


/**
 * Called when the user wants to delete a new item from the list.
 * 
 * @param inEvent Incoming event object.
 */
WikiListAssistant.prototype.wikiListDelete = function(inEvent) {

  woswiki.db.transaction((
    function (inTransaction) { 
      inTransaction.executeSql(
        "DELETE FROM wikis WHERE title=?", 
        [ inEvent.item.title ],
        function (inTransaction, inResultSet) { },
        woswiki.dbErrorHandler
      ); 
      inTransaction.executeSql(
        "DELETE FROM wikiArticles WHERE wiki=?", 
        [ woswiki.currentWiki ],
        function (inTransaction, inResultSet) { },
        woswiki.dbErrorHandler
      ); 			
    }
  )); 

}; // End wikiListDelete().
