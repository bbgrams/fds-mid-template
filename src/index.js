import '@babel/polyfill' // 이 라인을 지우지 말아주세요!

import axios from 'axios'
import { format } from 'path';

const api = axios.create({
  baseURL: process.env.API_URL
})

api.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = 'Bearer ' + token
  }
  return config
});

const templates = {
  loginForm : document.querySelector('#login-form').content,
}

const rootEl = document.querySelector('.root')

// 페이지 그리는 함수 작성 순서
// 1. 템플릿 복사
// 2. 요소 선택
// 3. 필요한 데이터 불러오기
// 4. 내용 채우기
// 5. 이벤트 리스너 등록하기
// 6. 템플릿을 문서에 삽입

// 로그인 화면
function drawLoginForm(){
  // 1. 템플릿 복사
  const frag = document.importNode(templates.loginForm, true)
  // 2. 요소 선택
  const formEl = frag.querySelector('.login')
  // 3. 필요한 데이터 불러오기

  // 4. 내용 채우기
  // 5. 이벤트 리스너 등록하기
  formEl.addEventListener('submit', async e => {
    e.preventDefault();
    const username = e.target.elements.username.value;
    const password = e.target.elements.password.value;

    const res = await api.post('/users/login', {
      username,
      password
    })

    localStorage.setItem('token', res.data.token)
    // drawMain()
    alert(`${username}님 로그인 되었습니다.`)
  })
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = '';
  rootEl.appendChild(frag)
}

drawLoginForm()
