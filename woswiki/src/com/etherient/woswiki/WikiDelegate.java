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


package com.etherient.woswiki;


import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.logging.Logger;
import javax.jdo.JDOObjectNotFoundException;
import javax.jdo.PersistenceManager;
import javax.jdo.Query;


/**
 * This class is the one DWR-exposed delegate that the client application calls
 * on to perform wiki functions.
 *
 * @author <a href="mailto:fzammetti@etherient.com">Frank W. Zammetti</a>
 *
 */
public class WikiDelegate {

  
  /**
   * Log instance to use throughout.
   */
  private static final Logger log = 
    Logger.getLogger(WikiDelegate.class.getName());

  
  /**
   * Gets a single article and optionally locks it for editing.  A lock request
   * is indicated by inUsername being non-null.  Here are the possible 
   * scenarios and their outcome:
   * 
   * 1. Article is requested when username is null (no edit lock requested):
   *    Article object is simply returned, regardless of its current edit lock
   *    state.
   * 2. Article is NOT currently locked and edit lock IS requested:
   *    Article object is simply returned, but only after lockedBy and
   *    lockedDateTime DB fields are updated to reflect the new lock.
   * 3. Article IS currently locked and edit lock IS requested:
   *    a. If the user holding the lock is the one requesting the lock, then
   *    lockedDateTime in DB is updated, effectively extending the lock,
   *    and the Article object is returned.  
   *    b. If the user holding the lock IS NOT the one requesting the lock,
   *    then the Article object is simply returned.
   *    In both these cases, the client should check if lockedBy == the
   *    current user.  If it is not, that indicates the article could not be
   *    locked for editing and the UI should report the information to the user.
   *
   * @param  inArticleTitle The title of the article to retrieve.
   * @param  inUsername     The username of the user trying to obtain an edit
   *                        lock, or null if no lock is being requested.
   * @return                The Article object.
   */
  public Article getArticle(final String inTitle, final String inUsername) {
    
    log.info("inTitle = " + inTitle);
    log.info("inUsername = " + inUsername);
    
    PersistenceManager persistenceManager =
      JDOUtil.persistenceManagerFactory.getPersistenceManager();

    Article article = null;

    try {
    
      // Try to retrieve the requested article from the DB.
      article = persistenceManager.getObjectById(Article.class, inTitle);
      log.info("Article '" + inTitle + "' retrieved from DB: " +
        article.toString());
    
      // Ok got it... did the caller request an edit lock?
      if (inUsername != null) {
        log.info("Edit lock on article requested");
        boolean obtainLock = false;
        String lockedBy = article.getLockedBy();
        if (lockedBy == null) {
          log.info("Article NOT currently locked");
          obtainLock = true;
        } else {
          log.info("Article IS currently locked, checking user");
          if (lockedBy.equalsIgnoreCase(inUsername)) {
            log.info("Article locked by requesting user");
            obtainLock = true;
          } else {
            log.info("Article NOT locked by requesting user, seeing if " +
              "lock has expired");
            if ((new Date().getTime() - 
              article.getLockedDateTime()) > (1000 * 60 * 5)) {
              log.info("Lock has expired, revoking lock");
              obtainLock = true;
            }
          }
        }
        
        // So now, if the lock is being obtained, update the DB to reflect that.
        if (obtainLock) {
          long lockedDateTime = new Date().getTime();
          log.info("Edit lock granted for article '" +
            inTitle + "' to user " + inUsername + " on " + lockedDateTime);
          article.setLockedBy(inUsername);
          article.setLockedDateTime(lockedDateTime);
          persistenceManager.makePersistent(article);
        } else {
          log.info("getArticle - Edit lock for article '" + inTitle + "' NOT " +
            "granted to user " + inUsername + " because it is already " +
            "locked by " + article.getLockedBy() + " on " + 
            article.getLockedDateTime());
        }
      }
      
    } catch (JDOObjectNotFoundException jonfe) {
      
      // Article does not yet exist, so create it.
      log.info("Article '" + inTitle + "' not in DB, so creating it now");
      article = new Article();
      article.setTitle(inTitle);
      article.setArticleText("This is a new article.  Please edit me!");
      persistenceManager.makePersistent(article);
      
    } finally {
      // Close persistence manager.  Must do this for updates to finalize.
      if (persistenceManager != null) {
        persistenceManager.close();
      }
    }

    log.info("Returning: " + article.toString());    
    return article;

  } // End getArticle().


  /**
   * Get a list of all articles.
   *
   * @param  inFullDetails When true, all details for each article is returned.
   *                       When false, only the title and lastEditedDateTime
   *                       are populated.
   * @return               A list of Article objects.
   */
  @SuppressWarnings("unchecked")
  public ArrayList<Article> listAll(final boolean inFullDetails) {
    
    PersistenceManager persistenceManager =
      JDOUtil.persistenceManagerFactory.getPersistenceManager();

    Query query = persistenceManager.newQuery(Article.class);
    Collection<Article> articles = (Collection)query.execute();
    
    if (inFullDetails == false) {
      for (Article a : articles) {
        a.setArticleText(null);
        a.setLastEditedBy(null);
        a.setLockedBy(null);
        a.setLockedDateTime(0);
      }
    }
    
    log.info("Returning " + articles.size() + " articles"); 
    return new ArrayList(articles);

  } // End listAll().


  /**
   * Update a given article.  Checks to be sure the user doing the update is
   * the one who owns the lock.
   *
   * @param  inArticle The Article object being updated.
   * @return           The Article object with any appropriate updates done.
   *                   Note that if the lastEditedBy value doesn't match the
   *                   lockedBy value then inArticle will be returned
   *                   unaltered.  The caller should check if lockedBy and
   *                   lockedDateTime is null, which indicates success,
   *                   otherwise it indicates the wrong user tried to save.
   */
  public Article updateArticle(final Article inArticle) {
    
    log.info("inArticle = " + inArticle);

    PersistenceManager persistenceManager =
      JDOUtil.persistenceManagerFactory.getPersistenceManager();

    // Retrieve the article, or create it if new.
    Article article = null;
    try {
      article = persistenceManager.getObjectById(
        Article.class, inArticle.getTitle());
    } catch (JDOObjectNotFoundException jonfe) {
      // Article does not yet exist, so create it.
      log.info("Article '" + inArticle.getTitle() + "' not in DB, " +
        "so creating it now");
      article = new Article();
      article.setTitle(inArticle.getTitle());
    }     

    if (article.getLockedBy() != null &&
      !inArticle.getLastEditedBy().equals(inArticle.getLockedBy())) {
      log.info("Editing user doesn't match locked user so not saving");
      return inArticle;
    }
    
    // Update its values.
    article.setLastEditedBy(inArticle.getLastEditedBy());
    article.setLastEditedDateTime(inArticle.getLastEditedDateTime());
    article.setLockedBy(null);
    article.setLockedDateTime(0);
    article.setArticleText(inArticle.getArticleText());
    
    // Save it to DB.
    persistenceManager.makePersistent(article);
    
    // Close persistence manager.  Must do this for updates to finalize.
    if (persistenceManager != null) {
      persistenceManager.close();
    }
    
    log.info("Save successful, returning: " + article.toString());    
    return article;

  } // End updateArticle().

  
} // End class.
