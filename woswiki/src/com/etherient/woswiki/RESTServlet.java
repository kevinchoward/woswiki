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


import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLDecoder;
import java.util.logging.Logger;
import javax.jdo.JDOObjectNotFoundException;
import javax.jdo.PersistenceManager;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


/**
 * This is a servlet that handles REST requests for woswiki.
 *
 * @author <a href="mailto:fzammetti@etherient.com">Frank W. Zammetti</a>
 *
 */
public class RESTServlet extends HttpServlet {
  
  
  /**
   * Just to avoid a warning really!
   */
  static final long serialVersionUID = 1;

   
  /**
   * Log instance to use throughout.
   */
  private static final Logger log = 
    Logger.getLogger(RESTServlet.class.getName());
  

  /**
   * Handle HTTP GET requests.
   * 
   * @param inRequest  An HTTPServletRequest object.
   * @param inResponse An HTTPServletResponse object.
   */
  public void doGet(HttpServletRequest inRequest, 
    HttpServletResponse inResponse) throws ServletException, IOException {
    
    log.info("doGet()");

    // The request URI tells us which REST boun to process, if any.
    String requestURI = inRequest.getRequestURI();
    log.info("requestURI = " + requestURI);

    // Only one noun to handle here.
    if (requestURI.indexOf("/woswiki") != -1) {
      
      log.info("Recognized woswiki noun");
      PrintWriter out = inResponse.getWriter();
      out.println("woswiki_1.0");
      
    }
   
  } // End doGet().

  
  /**
   * Handle HTTP POST requests.
   * 
   * @param inRequest  An HTTPServletRequest object.
   * @param inResponse An HTTPServletResponse object.
   */
  public void doPost(HttpServletRequest inRequest, 
    HttpServletResponse inResponse) throws ServletException, IOException {

    log.info("doPost()");   
    
    // The request URI tells us which REST noun to process, if any.
    String requestURI = inRequest.getRequestURI();
    log.info("requestURI = " + requestURI);    
    
    // Only one noun to handle here.
    if (requestURI.indexOf("/user/") != -1) {
      
      log.info("Recognized user noun");
      
      // Get username and password.  Username comes from the request URI since
      // it's a REST noun, the password is in the POST body.
      String username = URLDecoder.decode(
        requestURI.substring(requestURI.lastIndexOf("/") + 1), "UTF-8"
      );
      String password = inRequest.getParameter("password");
      log.info("username = " + username);
      log.info("password = " + password);
      
      // Prepare to look the user up, and maybe create them and generate a
      // response for the caller.
      PersistenceManager persistenceManager =
        JDOUtil.persistenceManagerFactory.getPersistenceManager();
      User user = null;
      PrintWriter out = inResponse.getWriter();
      
      try {
      
        // Try to retrieve the requested user from the DB.
        user = persistenceManager.getObjectById(User.class, username);
        log.info("User '" + username + "' retrieved from DB: " +
          user.toString());
      
        // Ok got it... does the password match?
        if (user.getPassword().equalsIgnoreCase(password)) {
          // Yes, indicate success to caller.
          out.println("ok");
        } else {
          // Nope, no good, go away evil caller!
          out.println("fail");
        }
        
      } catch (JDOObjectNotFoundException jonfe) {
        
        // User does not yet exist, so create it.
        log.info("User '" + username + "' not in DB, so creating it now");
        user = new User();
        user.setUsername(username);
        user.setPassword(password);
        persistenceManager.makePersistent(user);
        
        // Indicate successful operation to caller.
        out.println("ok");
        
      } finally {
        // Close persistence manager.  Must do this for updates to finalize.
        if (persistenceManager != null) {
          persistenceManager.close();
        }
      }      
      
    }
   
  } // End doPost().
  

} // End class.
