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


import javax.jdo.annotations.IdentityType;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;


/**
 * This class represents an article entity.
 *
 * @author <a href="mailto:fzammetti@etherient.com">Frank W. Zammetti</a>
 *
 */
@PersistenceCapable(identityType = IdentityType.APPLICATION)
public class Article {


  /**
   * The title of the article.
   */
  @Persistent
  @PrimaryKey
  private String title;


  /**
   * The text of the article.
   */
  @Persistent
  private String articleText;


  /**
   * The name of the person who last edited the article.
   */
  @Persistent
  private String lastEditedBy;

  
  /**
   * The date/time the article was last edited.
   */
  @Persistent
  private long lastEditedDateTime;
  

  /**
   * The name of the person who currently has the article for editing.
   */
  @Persistent
  private String lockedBy;


  /**
   * The date/time the article was locked for editing.
   */
  @Persistent
  private long lockedDateTime;


  /**
   * Set value of title field.
   *
   * @param inValue New value of the field.
   */
  public void setTitle(final String inValue) {

    this.title = inValue;

  } // End setTitle().


  /**
   * Get value of title field.
   *
   * @return Value of the field.
   */
  public String getTitle() {

    return this.title;

  } // End getTitle().


  /**
   * Set value of articleText field.
   *
   * @param inValue New value of the field.
   */
  public void setArticleText(final String inValue) {

    this.articleText = inValue;

  } // End setArticleText().


  /**
   * Get value of articleText field.
   *
   * @return Value of the field.
   */
  public String getArticleText() {

    return this.articleText;

  } // End getArticleText().


  /**
   * Set value of lastEditedBy field.
   *
   * @param inValue New value of the field.
   */
  public void setLastEditedBy(final String inValue) {

    this.lastEditedBy = inValue;

  } // End setLastEditedBy().


  /**
   * Get value of lastEditedBy field.
   *
   * @return Value of the field.
   */
  public String getLastEditedBy() {

    return this.lastEditedBy;

  } // End getLastEditedBy().

  
  /**
   * Set value of lastEditedDateTime field.
   *
   * @param inValue New value of the field.
   */
  public void setLastEditedDateTime(final long inValue) {

    this.lastEditedDateTime = inValue;

  } // End setLastEditedDateTime().


  /**
   * Get value of lastEditedDateTime field.
   *
   * @return Value of the field.
   */
  public long getLastEditedDateTime() {

    return this.lastEditedDateTime;

  } // End getLastEditedDateTime().
  

  /**
   * Set value of lockedBy field.
   *
   * @param inValue New value of the field.
   */
  public void setLockedBy(final String inValue) {

    this.lockedBy = inValue;

  } // End setLockedBy().


  /**
   * Get value of lockedBy field.
   *
   * @return Value of the field.
   */
  public String getLockedBy() {

    return this.lockedBy;

  } // End getLockedBy().


  /**
   * Set value of lockedDateTime field.
   *
   * @param inValue New value of the field.
   */
  public void setLockedDateTime(final long inValue) {

    this.lockedDateTime = inValue;

  } // End setLockedDateTime().


  /**
   * Get value of lockedDateTime field.
   *
   * @return Value of the field.
   */
  public long getLockedDateTime() {

    return this.lockedDateTime;

  } // End getLockedDateTime().


  /**
   * Overridden toString method.
   *
   * @return A reflexively-built string representation of this bean.
   */
  public String toString() {

    String str = null;
    StringBuffer sb = new StringBuffer(1000);
    sb.append("[").append(super.toString()).append("]={");
    boolean firstPropertyDisplayed = false;
    try {
      java.lang.reflect.Field[] fields = this.getClass().getDeclaredFields();
      for (int i = 0; i < fields.length; i++) {
        if (firstPropertyDisplayed) {
          sb.append(", ");
        } else {
          firstPropertyDisplayed = true;
        }
        sb.append(fields[i].getName()).append("=").append(fields[i].get(this));
      }
      sb.append("}");
      str = sb.toString().trim();
    } catch (IllegalAccessException iae) {
      iae.printStackTrace();
    }
    return str;

  } // End toString().


} // End class.
