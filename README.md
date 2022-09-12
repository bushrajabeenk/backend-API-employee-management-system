##Problem Statement

Create an employee management system for for a company's HR
every employee has a role
There are only 3 levels of roles in the company:
HR
Employee
Guests
There's no frontend only API endpoints.
have following routes:
/login To log user in
/signup To sign up a user
/reset-password to change password
/user/:userid gives user details
/verify to verify a token. return a new token if it's expired token
signup route is easy, take basic user details in body. make sure it has email as unqie field. we will use this later to send an email.
There's only one condition, only HR can create employee
if anyone else tries to create a user send proper failure message with proper status code
to signin make use of jwt based signin process. create a token and return it. for rest of the requests we need this token.
if token is not provided return proper message and status code.
tokens' expiry has to be 5mins
maintain a simple blacklist for tokens.
blacklist is just a simple array.
if a token is expired, you put it in this blacklist.
you can check if the token is expired on /verify route.
verify route only accepts token in the body and check if it's expired or not. if it's expired, then put it in blacklist and send proper response code
for any protected route, first check if the token is in this list
if it is then user is trying to login with expired or stolen token.
return proper message and status code in this case
if token is valid, show them user details on /user/:id route.
for /reset-password has 2 sub routes inside it
/reset-password/getotp route just send the email to the user with a random code (number). you have his email. use temporary mail service for sending mail.
feel free to use a library or just math.random here to generate a 4/6 digit long number
after user has OTP he makes a request to /reset-password/reset with OTP. this route accepts both OTP and new password with it.
if OTP is valid, and was sent to same user then update the password in db with the newly sent password.
hint: you can maintain another mongo collection for this. which simply has userid and OTP that was sent. feel free to use any other mechanism you want.
if OTP is not valid then send appropriate message and statuscode
