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
 * The main code for the app, anything that needs to be shared goes here.
 */
var woswiki = {


  /**
   * Reference to the database for the app.
   */
  db : null,


  /**
   * The title of the current wiki.
   */
  currentWiki : null,
	  
  
  /**
   * Reference to the current Article object.
   */
  currentArticle : null,
  
  
  /**
   * Username of the current user.
   */  
  username : null,


  /**
   * Password of the current user.
   */  
  password : null,
    
	
	/**
	 * Flag set when the background synchronizer is currently running.
	 */
	synchronizerRunning : false,
	
  
  /**
   * Method called at startup to initialize the app.
   */
  init : function() {

    // Open database, once per app invocation.
    woswiki.db = openDatabase("woswiki", "", "woswiki", 65536);
    
    // Create DB as needed.
    woswiki.db.transaction((function (inTransaction) {

      inTransaction.executeSql(
        "CREATE TABLE IF NOT EXISTS wikis (title TEXT, url TEXT, " +
        "username TEXT, password TEXT); GO;",
        [], 
        function(inTransaction, inResultSet) { }, 
        woswiki.dbErrorHandler
      );    
      inTransaction.executeSql(
        "CREATE TABLE IF NOT EXISTS wikiArticles (wiki TEXT, " +
        "title TEXT, articleText TEXT, lastEditedBy TEXT, " +
        "lastEditedDateTime INTEGER" +
			  "); GO;",
        [], 
        function(inTransaction, inResultSet) { }, 
        woswiki.dbErrorHandler
      ); 			
    }));
 
    // Set timeout for DWR calls to 5 seconds (error handler fires after that).
		dwr.engine.setTimeout(1000 * 5);

    // Kick off background content updater.
    setInterval(woswiki.backgroundSync, 1000 * 60 * 5);

  }, // End init().


  /**
   * This method handles any errors thrown by SQL executions.  It just displays
   * an error dialog and that's that.  We assume any error occurring here are
   * non-recoverable, and really this method should never get called or
   * something is probably seriously busted anyway.
   *
   * @param inTransaction Transaction object that exectued the SQL.
   * @param inError       SQLError object.
   */
  dbErrorHandler : function(inTransaction, inError) {

    Mojo.Controller.errorDialog(
      "DB ERROR - (" + inError.code + ") : " + inError.message
    );

  }, // End dbErrorHandler().
  
  
  /**
   * Activates links in article text (i.e., make them clickable to navigate to
   * another article).
   *
   * @param  inText The article text to activate links in.
   * @return        The article text with links activated.
   */
  activateLinks : function(inText) {

    var linkStart = inText.indexOf("~!");
    while (linkStart != -1) {
      var linkEnd = inText.indexOf("!~", linkStart);
      if (linkEnd != -1) {
        var articleTitle = inText.substring(linkStart + 2, linkEnd);
        inText = inText.substring(0, linkStart) +
          "<" + "a href=\"javascript:void(null);\" "+
          "onClick=\"" + "woswiki.linkClicked('" + articleTitle + "');\">" + 
          articleTitle + "<" + "/a>" + inText.substr(linkEnd + 2);        
      }
      linkStart = inText.indexOf("~!");
    }
    return inText;

  }, /* End activateLinks(). */
       
			 
  /**
   * Called when an article link is clicked.
   *
   * @param inTitle The title of the article link that was clicked.
   */
  linkClicked : function(inTitle) {

    $("viewArticle_divScrim").show();
    woswiki.getArticle(inTitle, null,
      function(inResponse) {
        woswiki.currentArticle = inResponse;
        $("viewArticle_divArticleTitle").innerHTML = inResponse.title;
        $("viewArticle_divArticle").innerHTML = 
          woswiki.activateLinks(inResponse.articleText);
        $("viewArticle_divScrim").hide();
      }
    );
          
  }, /* End linkClicked(). */
					 
   
  /**
   * Gets a single article and optionally locks it for editing.  A lock request
   * is indicated by inUsername being non-null.  Note that if the server
   * cannot be reached then the local DB version is used (or created if it
   * does not already exist).
   *
   * @param  inArticleTitle The title of the article to retrieve.
   * @param  inUsername     The username of the user trying to obtain an edit
   *                        lock, or null if no lock is being requested.
   * @param  inCallback     The function to call upon successful return of the
   *                        remote call.  Note: should be bound to the
   *                        appropriate context if applicable.
   */
	getArticle : function(inTitle, inUsername, inCallback) {

    // Define a function that will be used if connectivity isn't available
    // or if failure saves during server recall operation.
    var errorHandlerFunction = function(inMessage, inException) { 
      // Get article from local DB instead.
      woswiki.db.transaction((function (inTransaction) {
        inTransaction.executeSql(
          "SELECT * FROM wikiArticles WHERE wiki=? AND title=?; GO;",
          [ woswiki.currentWiki, inTitle ], 
          function(inTransaction, inResultSet) {
            // Get article from results, or create a new one.
            var article = null;
            if (inResultSet.rows.length != 0) {
              article = {
                wiki : inResultSet.rows.item(0).wiki,
                title : inResultSet.rows.item(0).title,
                articleText : inResultSet.rows.item(0).articleText,
                lastEditedBy : inResultSet.rows.item(0).lastEditedBy,
                lastEditedDateTime : 
                 inResultSet.rows.item(0).lastEditedDateTime
              };
            } else {
              article = {
                wiki : woswiki.currentWiki,
                title : inTitle,
                articleText : "This is a new article.  Please edit me!",
                lastEditedBy : null,
                lastEditedDateTime : 0
              };
            }
            // If we got the article from the DB then we set up for 
            // editing, whether that's needed or not.
            article.lockedBy = woswiki.username;
            article.lockedByDateTime = new Date().getTime();
            // We have an article either way, return it to the caller.
            inCallback(article);
          },
          woswiki.dbErrorHandler
        ); 
      }));        
    };

    // Check for connectivity.  If present, make DWR call, otherwise use
    // errorHandlerFunction code.
    var appController = Mojo.Controller.getAppController();
    var stageController = appController.getActiveStageController();
    var sceneController = stageController.activeScene();
    sceneController.serviceRequest("palm://com.palm.connectionmanager", {
      method : "getstatus",
      parameters : { subscribe : false },
      onSuccess : function(inResponse) {
        // Internet connection available.
        if (inResponse.isInternetConnectionAvailable) {
          WikiDelegate.getArticle(inTitle, inUsername, {
            errorHandler : errorHandlerFunction, 
            /* Article retrieved from server. */
            callback : function(inResponse) {
              inCallback(inResponse);
            }
          }); 
        // Internet connection not available.
        } else {
          errorHandlerFunction();
        }
      },
      onFailure : errorHandlerFunction
    });
  
  }, // End getArticle().

	
  /**
   * Update a given article.  Checks to be sure the user doing the update is
   * the one who owns the lock.
   * 
   * @param  inCallback The function to call upon successful return of the
   *                    remote call.  Note: should be bound to the
   *                    appropriate context if applicable.
   */	
	updateArticle : function(inCallback) {

	  woswiki.currentArticle.lastEditedBy = woswiki.username;
		woswiki.currentArticle.lastEditedDateTime = new Date().getTime();

    // Write article to local DB.    
    woswiki.db.transaction((function (inTransaction) {
      inTransaction.executeSql(
        "DELETE FROM wikiArticles WHERE wiki=? AND title=?; GO;",
        [ woswiki.currentWiki, woswiki.currentArticle.title ], 
        function(inTransaction, inResultSet) {
          woswiki.db.transaction((function (inTransaction) {
            inTransaction.executeSql(
              "INSERT INTO wikiArticles (wiki, title, articleText, " +
                "lastEditedBy, lastEditedDateTime) values (?, ?, ?, ?, ?); GO;",
              [ woswiki.currentWiki,
                woswiki.currentArticle.title, 
                woswiki.currentArticle.articleText, 
                woswiki.currentArticle.lastEditedBy, 
                woswiki.currentArticle.lastEditedDateTime 
              ], 
              function(inTransaction, inResultSet) { },
              woswiki.dbErrorHandler
            ); 
          }));         
        },
        woswiki.dbErrorHandler
      ); 
    }));
	
    // Check for connectivity.  If present, make DWR call.
    var appController = Mojo.Controller.getAppController();
    var stageController = appController.getActiveStageController();
    var sceneController = stageController.activeScene();
    sceneController.serviceRequest("palm://com.palm.connectionmanager", {
      method : "getstatus",
      parameters : { subscribe : false },
      onSuccess : function(inResponse) {
        // Internet connection available.
        if (inResponse.isInternetConnectionAvailable) {
          // Send article to server for updating.
          WikiDelegate.updateArticle(woswiki.currentArticle, { 
            errorHandler : function(inMessage, inException) { 
              // Couldn't reach remote server, but save to local DB should have 
              // been successful, so no problem.
              woswiki.currentArticle.lockedBy = null;
              inCallback(woswiki.currentArticle);
            }, 
            callback : inCallback 
          });
        // Internet connection not available.
        } else {
          woswiki.currentArticle.lockedBy = null;        
          inCallback(woswiki.currentArticle);
        }
      },
      onFailure : function() {
        woswiki.currentArticle.lockedBy = null; 
        inCallback(woswiki.currentArticle); 
      }
    });  
   
  }, // End updateArticle().
	
	
	/**
	 * This method is called every five minutes via an interval.  Its job, as
	 * long as the network is available, is to synchronize the local DB and
	 * the remote DB.  
	 * 
	 * It does this by retrieving a list of all articles on the
	 * server, and all articles in the local DB.  For any articles on the server
	 * that aren't in the local DB, they are retrieved and written to the local
	 * DB.  The opposite is done for any found in the local DB but not the server.  
	 * For any articles found in both places, their lastEditDateTime is compared 
	 * and the newer version overwrites the older version.  This isn't a perfect 
	 * mechanism, but it should generally be Good Enough(tm) for the purposes
	 * of this teaching exercise.  Anyone trying to use this app for real
	 * probably should take the time to make this more robust.
	 *    
	 */
	backgroundSync : function() {
  
    // Don't do anything if the background process is already running or if
    // there is no selected wiki.
    if (woswiki.synchronizerRunning || !woswiki.currentWiki) {
      return; 
    }
  
    Mojo.Log.error("##### backgroundSync() starting");  
    
    // Avoid the next interval trigger doing anything if already working.
    woswiki.synchronizerRunning = true;
      
    // Retrieve listing of all articles on the server.
    WikiDelegate.listAll(false, { 
      timeout : 1000 * 120,
      errorHandler : function(inMessage, inException) {
        Mojo.Log.error("##### backgroundSync() - AJAX error 1: " +
          inMessage + " - " + inException); 
      }, 
      callback : function(inResponse) {

        // Now get all the articles in the local DB.
        woswiki.db.transaction((function (inTransaction) {
          inTransaction.executeSql(
            "SELECT title, articleText, lastEditedBy, lastEditedDateTime " +
              "FROM wikiArticles WHERE wiki=?; GO;",
            [ woswiki.currentWiki ], 
            
            function(inTransaction, inResultSet) {
          
              try {            
            
                var i = null;
              
                // For speed, create a map version of each of the two arrays we
                // now have.  This way we can iterate over way we can iterate
                // over one and do simple lookups in the other rather than a
                // loop inside of a loop.
                var localDBArticles = [ ];
                var localDBArticlesMap = { };
                for (i = 0; i < inResultSet.rows.length; i++) {
                  var article = inResultSet.rows.item(i);
                  localDBArticles.push(article);
                  localDBArticlesMap[article.title] = article;
                }
                var serverArticles = inResponse;
                var serverArticlesMap = { };
                for (i = 0; i < serverArticles.length; i++) {
                  serverArticlesMap[serverArticles[i].title] = 
                    serverArticles[i];
                }
              
                // Now see if there are any articles on the server that aren't
                // in the local DB and add them if so.
                for (i = 0; i < serverArticles.length; i++) {
                  Mojo.Log.error("##### backgroundSync() - " +
                    "Loop A (new articles on server): " + i);
                  var serverArticle = serverArticles[i];
                  var localDBArticle = localDBArticlesMap[serverArticle.title];
                  if (!localDBArticle) {
                    Mojo.Log.error("##### backgroundSync() - Adding server " +
                      "article '" + serverArticle.title + "' to local DB");
                    woswiki.db.transaction((function (inTransaction) {
                      inTransaction.executeSql(
                        "INSERT INTO wikiArticles (wiki, title, articleText, " +
                          "lastEditedBy, lastEditedDateTime) values " +
                          "(?, ?, ?, ?, ?); GO;",
                        [ woswiki.currentWiki,
                          serverArticle.title, 
                          serverArticle.articleText, 
                          serverArticle.lastEditedBy, 
                          serverArticle.lastEditedDateTime 
                        ], 
                        function() { }, 
                        function(inTransaction, inError) {
                          Mojo.Log.error(
                            "##### backgroundSync() - DB error 2a: " +
                            inTransaction + " - " + inError
                          );  
                        }
                      ); 
                    })); 
                  }
                }
  
                // Now see if there are any articles in the local DB that aren't
                // on the server and add them if so.
                for (i = 0; i < localDBArticles.length; i++) {
                  Mojo.Log.error("##### backgroundSync() - " +
                    "Loop B (new articles in local DB): " + i);
                  var localDBArticle = localDBArticles[i];
                  var serverArticle = serverArticlesMap[localDBArticle.title];
                  if (!serverArticle) {
                    Mojo.Log.error("##### backgroundSync() - Adding local " +
                      "article '" + localDBArticle.title + "' to server");   
                    WikiDelegate.updateArticle(localDBArticle, { 
                      errorHandler : function(inMessage, inException) {
                        Mojo.Log.error(
                          "##### backgroundSync() - AJAX error 2a: " +
                          inMessage + " - " + inException
                        ); 
                      }, 
                      callback : function() { } 
                    });
                  }
                }
                // Now see if there are any articles on the server that are
                // newer than what's in the local DB and update them if so.
                for (i = 0; i < serverArticles.length; i++) {
                  Mojo.Log.error("##### backgroundSync() - Loop C " +
                    "(more recent versions on server): " + i);
                  var serverArticle = serverArticles[i];
                  var localDBArticle = localDBArticlesMap[serverArticle.title];
                  // Now insert server article into local DB if not there yet.
                  if (serverArticle && localDBArticle &&
                    serverArticle.lastEditedDateTime > 
                    localDBArticle.lastEditedDateTime) {
                    Mojo.Log.error("##### backgroundSync() - Updating local " +
                      "article '" + serverArticle.title + "' from server");                    
                    woswiki.db.transaction((function (inTransaction) {
                      inTransaction.executeSql(
                        "INSERT INTO wikiArticles (wiki, title, articleText, " +
                          "lastEditedBy, lastEditedDateTime) values " +
                          "(?, ?, ?, ?, ?); GO;",
                        [ woswiki.currentWiki,
                          serverArticle.title, 
                          serverArticle.articleText, 
                          serverArticle.lastEditedBy, 
                          serverArticle.lastEditedDateTime 
                        ], 
                        function() { }, 
                        function(inTransaction, inError) {
                          Mojo.Log.error(
                            "##### backgroundSync() - DB error 2b: " +
                            inTransaction + " - " + inError
                          );  
                        }
                      ); 
                    })); 
                  }
                }              
  
                // Now see if there are any articles in the local DB that are
                // newer than what's on the server and update them if so.
                for (i = 0; i < localDBArticles.length; i++) {
                  Mojo.Log.error("##### backgroundSync() - Loop D " +
                    "(more recent versions in local DB): " + i);
                  var localDBArticle = localDBArticles[i];
                  var serverArticle = serverArticlesMap[localDBArticle.title];
                  // Now send local article to server if not there yet.
                  if (localDBArticle && serverArticle &&
                    localDBArticle.lastEditedDateTime > 
                    serverArticle.lastEditedDateTime) {
                    Mojo.Log.error("##### backgroundSync() - Updating server " +
                      "article '" + localDBArticle.title + "' from local DB");                    
                    WikiDelegate.updateArticle(localDBArticle, { 
                      errorHandler : function(inMessage, inException) {
                        Mojo.Log.error(
                          "##### backgroundSync() - AJAX error 2b: " +
                          inMessage + " - " + inException
                        ); 
                      }, 
                      callback : function() { } 
                    });
                  }              
                }              
                
              } catch (e) {
                Mojo.Log.error("##### backgroundSync() - Process error: " + e);
              }              
              
              // All done, allow the next interval iteration to do this again.
              woswiki.synchronizerRunning = false; 

            }, /* End select all articles DB success callback */
            
            function(inTransaction, inError) {
              Mojo.Log.error(
                "##### backgroundSync() - DB error 1: " +
                inTransaction + " - " + inError
              ); 
            }
            
          );

        }));       
          
      } // End listAll() callback.
      
    }); // End listAll() call metadata object.     
  
  } // End backgroundSync().
  

}; // End woswiki object.
