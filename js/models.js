"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  //  Sometimes we need a "blueprint" for creating many objects of the same "type".
  //  The way to create an "object type", is to use an object constructor function.
  //  Objects of the same type are created by calling the constructor function with the new keyword:
  //  const myFather = new Person("John", "Doe", 50, "blue");

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // UNIMPLEMENTED: complete this function!
    return new URL(this.url).host;
  }
}
// the host name is the url of the article being linked to? - website.com, not website.com/etc/etc/etc
// why do we need this?

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   * // question - what does that returned instance look like? {storyID, title, author, etc} repeated?
   */

  // how does a function inside of a class get called?
  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // instance method - called on a particular instance of a class. like for news stories "NASDAQ Crashes", you might call a method on that story, like NASDAQ-Crashes.read(), then you can read it.
    // static method - called on the whole class. so here we're calling getStories on the class of StoryList as a whole. or are we calling it on the Story class? it'd be a static method because we want all the stories in that class, not just a particular instance. But I'm not sure why it comes after the StoryList class, maybe it doesn't matter.
    // a google search about this might be 'use function to make array out of all instances of a class.'

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));
    // takes each of the stories in the response and tosses it into the Story class, where each is constructed into an instance of Story. 
    // again the order is throwing me off here - why is this listed after Story class is declared? Probably because what would this be mapping to if it wasn't already created. 

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    // UNIMPLEMENTED: complete this function!
    const token = user.loginToken;
    const response = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`,
      data: { token, story: { title, author, url } },
    });

    const story = new Story(response.data.story);
    this.stories.unshift(story);
    user.ownStories.unshift(story);

    return story;
  }

  async removeStory(user, storyId) {
    const token = user.loginToken;cx
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: user.loginToken }
    });

    // filter out the story whose ID we are removing
    this.stories = this.stories.filter(story => story.storyId !== storyId);

    // do the same thing for the user's list of stories & their favorites
    user.ownStories = user.ownStories.filter(s => s.storyId !== storyId);
    user.favorites = user.favorites.filter(s => s.storyId !== storyId);
  } 
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }
  async addFavorite(story) {
    this.favorites.push(story);
    await this._addOrRemoveFavorite("add", story)
  }

  /** Remove a story to the list of user favorites and update the API
   * - story: the Story instance to remove from favorites
   */

  async removeFavorite(story) {
    this.favorites = this.favorites.filter(s => s.storyId !== story.storyId);
    await this._addOrRemoveFavorite("remove", story);
  }

  /** Update API with favorite/not-favorite.
   *   - newState: "add" or "remove"
   *   - story: Story instance to make favorite / not favorite
   * */

   async _addOrRemoveFavorite(newState, story) {
    const method = newState === "add" ? "POST" : "DELETE";
    const token = this.loginToken;
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: method,
      data: { token },
    });
  }

  /** Return true/false if given Story instance is a favorite of this user. */

  isFavorite(story) {
    return this.favorites.some(s => (s.storyId === story.storyId));
  }
}
