const axios = require('axios');

const questions = [
  {
    message: "How do I start a Mandarin class?",
    response: "Please sign up for an account and complete the basic information. Then, you can explore our tutor list and find a tutor you like. Select a time slot and schedule a one-on-one lesson! Pay with money points and start your learning journey on the device of your choice. *Each point is equivalent to 1 USD."
  },
  {
    message: "How do I update my personal information?",
    response: "Click on your profile photo in the top right corner, then select \"Basic Information\" to start editing. ![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+update+my+personal+information%3F.png)"
  },
  {
    message: "How do I enter the online classroom?",
    response: "Please go to the \"Class Schedule\" page.\n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+enter+the+online+classroom1.png) \nClick on the lesson you are going attend and click Enter classroom. \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+enter+the+online+classroom2.png)"
  },
  {
    message: "How do I find a tutor?",
    response: "Visit our tutor list page [https://baodaotalk.com/en/tutors](https://baodaotalk.com/en/tutors).\nBrowse the tutor list, review their background, expertise, and experience, and select the tutor that best suits your needs."
  },
  {
    message: "What payment methods do we accept?",
    response: "Course fees are paid using currency points, with each point equivalent to 1 USD. \nWe accept all major debit and credit cards, including Visa, MasterCard, American Express, JCB, and UnionPay.\n ![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/+What+payment+methods+do+we+accept%3F.png)"
  },
  {
    message: "What is spiral curriculum design?",
    response: "Spiral curriculum design revisits and expands on previous course content to help students thoroughly understand and reinforce the knowledge they have learned.\n ![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/What+is+spiral+curriculum+design%3F.png)"
  },
  {
    message: "How do I reschedule or cancel my lesson?",
    response: "You can cancel a scheduled lesson up to **12 hours before the start of the class.** \nPlease go to 'Class Schedule' and click on the lesson you want to reschedule.\n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+reschedule+or+cancel+my+lesson%3F1.png) \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+reschedule+or+cancel+my+lesson%3F2.png) \nPlease provide the reason for your inconvenience.\n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+reschedule+or+cancel+my+lesson%3F3.png)\nAfter clicking 'Confirm Cancellation', the points will be returned to your available balance, and you can reschedule the class."
  },
  {
    message: "How do I sign up for a free Mandarin class?",
    response: "**1. Sign Up:** Create an account on the platform. \n![image](https://static-prod-baodao.s3.amazonaws.com/homepage/Free+trial-+1.+Sign+Up.gif) \n**2. Select a Tutor:** Choose a tutor who best suits your learning needs and preferences. \n![image](https://static-prod-baodao.s3.amazonaws.com/homepage/Free+trial-+2.+select+a+tutor.gif) \n**3. Select a Time Slot:** Pick a time and date that fits your availability. If you can't find the right time, you can click the Contact us to schedule button. We can assist you with lesson scheduling. \n![image](https://static-prod-baodao.s3.amazonaws.com/homepage/Free+trial-+3.+select+a+slot.png) \n**4. Confirm:** Press the confirm button, and you will see your free trial lesson has been scheduled. \n![image](https://static-prod-baodao.s3.amazonaws.com/homepage/Free+trial-+4.+Start+your+learning+journey+with+BaoDao+Talk.gif)"
  },
  {
    message: "How do I log in to my account? - Google?",
    response: "Please click the 'Log in with Google' button. \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/Google1.png) \nIf you have multiple Google accounts, select the one you used to sign up for BaoDao Talk. If your Google account is not listed, click 'Use another account' and enter your Gmail address and password. \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/Google2.png) \nClick the continue button, you'll be redirected back to the website \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/Google3.png) \nYou're in! Start your Mandarin learning journey with BaoDao Talk. \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/Google4.png)"
  },
  {
    message: "How do I log in to my account? - Email",
    response: "Please enter the email address you used to register for the website and click the 'Log in with email' button. \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/Email1.png) \nClick on the 'check your inbox' button and open the email from BaoDao Talk, and then click the 'Login to BaoDao Talk' button. This will redirect you to the website and automatically log you in. \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/Email2.png) \nYou're in! Start your Mandarin learning journey with BaoDao Talk. \n![image](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/Email3.png)"
  },
  {
    message:"How do I log in to my account? - Facebook",
    response:"Please click the 'Log in with Facebook' button.\n![pic](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+log+in+to+my+account%3F+-+Facebook1.png)\nClick the continue button, you'll be redirected back to the website\n![pic](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+log+in+to+my+account%3F+-+Facebook2.png)\nYou're in! Start your Mandarin learning journey with BaoDao Talk.\n![pic](https://static-dev-baodao.s3.ap-northeast-2.amazonaws.com/FAQ/How+do+I+log+in+to+my+account%3F+-+Facebook3.png)"
  },
];

// 向 API 发送请求添加假数据
async function seedData() {
  try {
    for (const question of questions) {
      const response = await axios.post('http://localhost:3001/api/add', question);
      console.log(`Added question: ${question.message}`);
    }
    console.log('Data seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData();