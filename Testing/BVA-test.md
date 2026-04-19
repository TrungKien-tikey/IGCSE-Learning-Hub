Function Code	Function1	Function Name	login				
Field	Status / Boundary	Input	Expected	Description	Procedure	Status
TC_LG_01	email	Missing	(omit)	400 Bad Request	Kiem tra thieu truong email. He thong phai tra ve loi validation khi khong cung cap email.	POST {{auth_base}}/api/auth/login body: {"password":"abc321"}	P
TC_LG_02	email	Invalid format	user5example.com	400 Bad Request	Kiem tra email sai dinh dang. He thong phai tu choi email khong hop le.	POST {{auth_base}}/api/auth/login body: {"email":"user5example.com","password":"abc321"}	P
TC_LG_03	email	Valid	user5@example.com	200 OK	Kiem tra email hop le voi mat khau dung. He thong dang nhap thanh cong.	POST {{auth_base}}/api/auth/login body: {"email":"user5@example.com","password":"abc321"}	P
TC_LG_04	password	Missing	(omit)	400 Bad Request	Kiem tra thieu truong password. He thong phai tra ve loi validation khi khong cung cap mat khau.	POST {{auth_base}}/api/auth/login body: {"email":"user5@example.com"}	P
TC_LG_05	password	Wrong	wrongpass	401 Unauthorized	Kiem tra mat khau sai. He thong phai tu choi dang nhap voi thong tin xac thuc khong dung.	POST {{auth_base}}/api/auth/login body: {"email":"user5@example.com","password":"wrongpass"}	P
TC_LG_06	password	Empty string	""	400 Bad Request	Kiem tra mat khau rong. He thong phai bao loi validation.	POST {{auth_base}}/api/auth/login body: {"email":"user5@example.com","password":""}	P

Function Code	Function2	Function Name	register				
Field	Status / Boundary	Input	Expected	Description	Procedure	Status
TC_RG_01	fullName	Empty	""	400 Bad Request	Kiem tra fullName rong. He thong phai bao loi validation khi ten bi thieu hoac de trong.	POST {{auth_base}}/api/auth/register body: {"fullName":"","email":"user+1@example.com","password":"Passw0rd!","role":"STUDENT"}	P
TC_RG_02	fullName	Min	"A"	201 Created	Kiem tra fullName tai bien duoi hop le voi 1 ky tu. He thong cho phep dang ky thanh cong.	POST {{auth_base}}/api/auth/register body: {"fullName":"A","email":"user+2@example.com","password":"Passw0rd!","role":"STUDENT"}	P
TC_RG_03	fullName	Max + 1	<256chars>	400 Bad Request	Kiem tra fullName vuot qua do dai toi da. He thong phai tu choi gia tri qua dai.	POST {{auth_base}}/api/auth/register body: {"fullName":"<256chars>","email":"user+3@example.com","password":"Passw0rd!","role":"STUDENT"}	P
TC_RG_04	email	Missing	(omit field)	400 Bad Request	Kiem tra thieu truong email. He thong phai bao loi khi khong cung cap email.	POST {{auth_base}}/api/auth/register body: {"fullName":"Test User","password":"Passw0rd!","role":"STUDENT"}	P
TC_RG_05	email	Invalid format	userexample.com	400 Bad Request	Kiem tra email sai dinh dang. He thong phai tu choi email khong hop le.	POST {{auth_base}}/api/auth/register body: {"fullName":"Test User","email":"userexample.com","password":"Passw0rd!","role":"STUDENT"}	P
TC_RG_06	email	Max	<254-char email>	201 Created	Kiem tra email tai do dai toi da hop le. He thong cho phep dang ky thanh cong.	POST {{auth_base}}/api/auth/register body: {"fullName":"Test User","email":"<254-char email>","password":"Passw0rd!","role":"STUDENT"}	P
TC_RG_07	email	Max + 1	<255+ char email>	400 Bad Request	Kiem tra email vuot qua do dai toi da. He thong phai bao loi validation.	POST {{auth_base}}/api/auth/register body: {"fullName":"Test User","email":"<255+ char email>","password":"Passw0rd!","role":"STUDENT"}	P
TC_RG_08	email	Duplicate	existing email	409 Conflict	Kiem tra email da ton tai trong he thong. He thong phai tu choi dang ky voi email trung lap.	POST {{auth_base}}/api/auth/register body: {"fullName":"Test User","email":"user4@example.com","password":"Passw0rd!","role":"STUDENT"}	P

Function Code	Function3	Function Name	logout				
Field	Status / Boundary	Input	Expected	Description	Procedure	Status
TC_LO_01	token	Missing	(omit)	401 Unauthorized	Kiem tra thieu access token khi dang xuat. He thong phai tu choi yeu cau chua xac thuc.	POST {{auth_base}}/api/auth/logout header: Authorization: (omit)	P
TC_LO_02	token	Malformed	malformed_token	401 Unauthorized	Kiem tra JWT malformed sau Bearer. He thong phai tu choi dang xuat.	POST {{auth_base}}/api/auth/logout header: Authorization: Bearer malformed_token	P
TC_LO_03	token	Expired	expired_token	401 Unauthorized	Kiem tra token het han. He thong khong cho phep dang xuat voi token khong con hieu luc.	POST {{auth_base}}/api/auth/logout header: Authorization: Bearer expired_token	P
TC_LO_04	token	Valid	valid_token	200 OK	Kiem tra dang xuat voi token hop le. He thong dang xuat thanh cong.	POST {{auth_base}}/api/auth/logout header: Authorization: Bearer valid_token	P

Function Code	Function4	Function Name	forgotPassword				
Field	Status / Boundary	Input	Expected	Description	Procedure	Status
TC_FP_01	email	Missing query param	(omit)	400 Bad Request	Kiem tra thieu email query param trong yeu cau quen mat khau. He thong phai bao loi.	POST {{auth_base}}/api/auth/forgot-password	P
TC_FP_02	email	Invalid format	userexample.com	400 Bad Request	Kiem tra email sai dinh dang qua query param. He thong phai tu choi yeu cau.	POST {{auth_base}}/api/auth/forgot-password?email=userexample.com	P
TC_FP_03	email	Not found	notfound@example.com	400 Bad Request	Kiem tra email khong ton tai trong he thong. Theo contract hien tai controller tra ve 400 Bad Request.	POST {{auth_base}}/api/auth/forgot-password?email=notfound@example.com	P
TC_FP_04	email	Valid	user5@example.com	200 OK	Kiem tra email hop le da ton tai. He thong gui yeu cau dat lai mat khau thanh cong.	POST {{auth_base}}/api/auth/forgot-password?email=user5@example.com	P

Function Code	Function5	Function Name	changePassword				
Field	Status / Boundary	Input	Expected	Description	Procedure	Status
TC_CP_01	oldPassword	Missing	(omit)	400 Bad Request	Kiem tra thieu mat khau cu tren protected endpoint. He thong phai bao loi validation/nghiep vu voi JWT hop le.	POST {{auth_base}}/api/auth/change-password header: Authorization: Bearer valid_token body: {"newPassword":"abc123456","confirmPassword":"abc123456"}	P
TC_CP_02	oldPassword	Wrong	wrongOldPass	400 Bad Request	Kiem tra mat khau cu khong dung. Theo contract hien tai service map ve 400 Bad Request.	POST {{auth_base}}/api/auth/change-password header: Authorization: Bearer valid_token body: {"oldPassword":"wrongOldPass","newPassword":"abc123456","confirmPassword":"abc123456"}	P
TC_CP_03	newPassword	Missing	(omit)	400 Bad Request	Kiem tra thieu mat khau moi tren protected endpoint. He thong phai bao loi voi JWT hop le.	POST {{auth_base}}/api/auth/change-password header: Authorization: Bearer valid_token body: {"oldPassword":"abc321"}	P
TC_CP_04	newPassword	Empty string	""	400 Bad Request	Kiem tra mat khau moi rong. Case nay duoc giu de bat bug neu validation chua day du.	POST {{auth_base}}/api/auth/change-password header: Authorization: Bearer valid_token body: {"oldPassword":"abc321","newPassword":"","confirmPassword":""}	P
TC_CP_05	newPassword	Valid	abc123456	200 OK	Kiem tra doi mat khau voi du lieu hop le. He thong cap nhat mat khau thanh cong.	POST {{auth_base}}/api/auth/change-password header: Authorization: Bearer valid_token body: {"oldPassword":"abc321","newPassword":"abc123456","confirmPassword":"abc123456"}	P

Function Code	Function6	Function Name	securityFilterChain				
Field	Status / Boundary	Input	Expected	Description	Procedure	Status
TC_SFC_01	Authorization	Missing	(omit)	401 Unauthorized	Kiem tra protected endpoint ma khong co token. Security filter chain phai chan yeu cau.	POST {{auth_base}}/api/auth/logout header: Authorization: (omit)	P
TC_SFC_02	Authorization	Invalid	Bearer invalid_token	401 Unauthorized	Kiem tra token khong hop le. Security filter chain phai tu choi truy cap.	POST {{auth_base}}/api/auth/logout header: Authorization: Bearer invalid_token	P
TC_SFC_03	Authorization	Valid	Bearer valid_token	200 OK	Kiem tra protected endpoint voi token hop le. He thong cho phep di vao controller.	POST {{auth_base}}/api/auth/logout header: Authorization: Bearer valid_token	P
TC_SFC_04	Request path	Public endpoint	/api/auth/health	200 OK	Kiem tra endpoint public khong yeu cau xac thuc. Security filter chain phai cho phep di qua.	GET {{auth_base}}/api/auth/health	P

Function Code	Function7	Function Name	doFilterInternal				
Field	Status / Boundary	Input	Expected	Description	Procedure	Status
TC_DFI_01	Authorization	Missing	(omit)	401 Unauthorized	Kiem tra khong gui header Authorization tren protected endpoint. Bo loc phai tu choi yeu cau.	POST {{auth_base}}/api/auth/logout header: Authorization: (omit)	P
TC_DFI_02	Authorization	Invalid prefix	Token abc123	401 Unauthorized	Kiem tra Authorization khong dung dinh dang Bearer. Bo loc phai tu choi yeu cau.	POST {{auth_base}}/api/auth/logout header: Authorization: Token abc123	P
TC_DFI_03	token	Invalid	invalid_jwt_token	401 Unauthorized	Kiem tra JWT khong hop le. Bo loc phai khong thiet lap thong tin xac thuc.	POST {{auth_base}}/api/auth/logout header: Authorization: Bearer invalid_jwt_token	P
TC_DFI_04	token	Expired	expired_jwt_token	401 Unauthorized	Kiem tra JWT da het han. Bo loc phai tu choi xac thuc.	POST {{auth_base}}/api/auth/logout header: Authorization: Bearer expired_jwt_token	P
TC_DFI_05	token	Valid	valid_jwt_token	200 OK	Kiem tra JWT hop le. Bo loc phai cho phep request tiep tuc xu ly.	POST {{auth_base}}/api/auth/logout header: Authorization: Bearer valid_jwt_token	P
