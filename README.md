# CS351Group8

github for group 8 of the fullstack group project
# Logistics  

**Q1:** At what time in the week would your group be available to meet online?  

*We are usually able to meet online Monday before noon(11am-12pm), with the ability to move it around when needed to Wednesday. Of course it depends on the day and person specifically, but that is a good estimate of what days we are available and plan on meeting.*

---

# Timeline: Weekly Meeting Goals  

**Q2:** What is your goals that your group want to achieve in each weekly meeting?  
  
*During each weekly meeting, our hope is to talk about what we have done, what is needed and when it is needed to be done by. For example, these last 2 weeks, we met and discussed how to divide everything, when we would like to have it done by, and when it is actually due, that way we could have cushion and time to talk. When we are stuck on a specific part of the project, we will discuss it then as well.*

---

# Communication  

**Q3a:** How can your group communicate when doing the Full Stack Group Project? 

*Our group communication is through snapchat, we have a groupchat and also are able to call through there if it is ever needed.*

**Q3b:** What are the usernames of each group member on that platform?  

*Usernames:*  
*Mo Abdelmajid - supermo2002
Bryan Dominguez - b.dominguez10
IanCarlo Trejo - iancarlo2003
Oday Suleiman - odaysuleiman14*  

**Q3c:** What is your group’s expected response time to messages?  

*We usually try to respond within 4 hours, everyone's schedule is different so we recognize there is always a chance for delays, but 1 person usually responds.*

---

# Norms  

**Q4a:** How will your group handle situations when there is conflict in your group?  

If there is a personal conflict, we will focus on the success of the project and not let it affect the workflow. If the conflict is proffesional, we will have a discussion about to convince the other about our side, and if that isn't enough we vote for it

**Q4b:** How will your group handle situations when a member is not contributing enough?  

*First, we will remind them of the work. A few chances will be given to each member, and those who don't pull their weight will be expected to make up for it later, or at least not repeat that same mistake. If a member is completely ghosting the team or not listeing to warnings, we will mention it to the professor/TA and cook them in the group evaluation*
 

---

# Roles  

**Q5:** How will your group divide your role in the Group Project?  

*Mo Abdelmajid - Project Lead
Oday Suleiman - backend 
IanCarlo Trejo, Bryan Dominguez - frontend*


---

# Tech Stacks

**Q6:** Which tech stacks will your group use? (Django + React or Flask + React)

*Flask + React*

---
# Full Stack Group Project Track  
---

# Track 1: Tackling Generative AI Consequences
**Problem 1:** 
*Certain AI tools have shown bias when it comes to salary with men and women, if you compare the 2 and give them the exact same resume, the AI will favor the man and say their salary should be higher, even though they are the same in their experience. This bias makes AI tools reviewing resumes(which people often use) unreliable and misleading*


**Solution 1:** 
*Develop an resume building/review app that removes the bias out of it, instead focuses on the persons experience and qualifications, with gender a complete non-factor. Also, it will have a feature that tests for the AI bias by running those tools on the resume, so users can see the difference between the reviews and get a complete picture of the strength of their resume with and without gender bias*

---

# Track 2: Technology for Public Goods 

**Problem 2:**

**Problem 2:** 
*There are no good web applications dedicated to student interaction or sharing knowledge ethically. Most of the current popular student websites involve academic dishonesty, like Chegg or Quizzard. This often pressures students into being dishonest or using generative AI(like ChatGPT) as an easy solution when they are lost*

**Solution 2:** 
*Student social media/wiki app where students can post notes, links to helpful videos, upcoming events, or other student related posts. It will be divided based on university or subject, and there will be logins based on school accounts, with bookmarks and created posts tied to that account. This app will hopefully become the honest and convenient option for students looking for extra help or connection*

**Problem 3:** 

**Solution 3:**  

# Track 3: Creative Coding and Cultural Expression

**Idea - Story - Inspiration 4:**

**Implementation 4:**

**Idea - Story - Inspiration 5:**

**Implementation 5:**


# Idea Finalization

**From 5 project ideas you have above, please choose one of the project that you are going with for the rest of the semester. Explain why you are going with that project**

*The idea we are going with is the student social media/wiki(solution 2). It has the most room for finnesse, while not being as niche in use or complicated to implement as some other ideas. Also, we can implement all the extra credit questions using this idea.*

# Extra Credit (Only do this if you are done with Idea Finalization)

## Database Design

**Q1: What database are you using for your project (SQLite, PostgreSQL, noSQL, MongoDB,...), and why do you choose it?**

*The database will be using PostgreSQL. The reason is because we need a cloud-based database, and all of us have prior experience in SQLite so it will be an easy transition.*

**Q2: How will database be helpful to your project? How will you design your database to support your application features?**

*Since theres a sign-in part of the app, the database will be used to record user data(username,email,password,bookmarks,etc).
The database will support all "user" features, by storing the ID# of bookmarks, created posts, amount of followers, and other relevant info.*

## Third-Party API Integration

**Q3: Which third-party API(s) will you integrate into your project? What data will you pull from the API(s), and how will you use it in your application?**

*IPStack and Auth0(or a similar authentication API) will be used. IPStack will be used to check the location of the user and recomend university pages for them to check out, while Auth0 will be used to manage log-ins.*

**Q4: Does your API key has limitations such as rate limits or downtime? How are you going to deal with that?**

*IPStack has a limit of 100 requests/month for the free plan. Auth0 is alot more generous with 7000 active monthly users and 50 requests/second for the free plan. The limit for Auth0 is inconsequential, the free plan is sufficient for this app. If it isn't, we can add some donation link on the app(like Wikipedia) and attempt a paid plan. For IPStack, we limit the calls to it by storing the last IP Address and list of nearby universities for the user in the database. The IPStack API call will only happen if the current IP Address is different from the one stored in the database and a specific button is pressed. This will minimize the number of IPStack API calls. If that isn't enough, we can lock the IPStack API behind some kind of premium membership or internal point system based on app usage, so only those we know use the app often can enjoy that feature. Also, we could allow others to use their own API keys for them.*

## Authentication and Security

**Q5: What authentication method will you use (e.g., username/password, OAuth, JWT)?**

*The authentication method will be username/password, along with Auth0 authentication to sign-in with the restriction of only allowing school accounts.*

**Q6: How will you store and protect sensitive user data (e.g., passwords, tokens)?**

*The passwords will be managed entirely by Auth0, so those will be secure. The only user sensitive data used will be email accounts, which will not be stored locally and will secured in the database with PostGreSQL's database encryption.*

## Deployment

**Q7: Where will you deploy your project (e.g., Heroku, AWS, Render)? How will you manage environment variables and secrets during deployment?**

*We will be using Render(pointing to our github repo). For the environmental variables and secrets during deployment, we will be using local .env files and loading those files using os.getenv in Flask.*

**Q8: How will you ensure your deployment is reliable and easy to update?**

*For reliability, we will lock python versions, keep logs, and enable automatic Database backups. 
For easy updates, we will enable automatic deploy on merge(we develop updates on a sub-branch and merge when finished) and enable one-click rollback(which is supported on Render). Also, perform CI sanity checks by running pytest/flake8 on PRs, so it only merges green builds.*