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
  productsForm : document.querySelector('#products-form').content,
  productsItems: document.querySelector('#product-items').content,
  productsDetail: document.querySelector('#products-detail').content,

}

const rootEl = document.querySelector('.root')
const pageTitleEl = document.querySelector('.page-title') // 페이지 별 타이틀
let pageTitle= '빕다방'

// 페이지 그리는 함수 작성 순서
// 1. 템플릿 복사
// 2. 요소 선택
// 3. 필요한 데이터 불러오기
// 4. 내용 채우기
// 5. 이벤트 리스너 등록하기
// 6. 템플릿을 문서에 삽입

// *** 3. 상품 페이지 ***
async function drawDetail(productId){
// 1. 템플릿 복사
  const frag = document.importNode(templates.productsDetail, true)
// 2. 요소 선택
  const titleEl = frag.querySelector('.detail-title');
  const imgEl = frag.querySelector(".img");
  const infoEl = frag.querySelector('.detail-info')

// 3. 필요한 데이터 불러오기
  const { data : {title, price, description, mainImgUrl, options} } = await api.get('/products/' + productId, {
    params:{
      _embed : 'options'
    }
  })

  // 4. 내용 채우기
  titleEl.textContent = title;
  imgEl.setAttribute('src', mainImgUrl);
  infoEl.textContent = description;
  console.log(options)
  // options[0]



  // 5. 이벤트 리스너 등록하기
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent=''
  rootEl.appendChild(frag)
}

// *** 2. 메인화면 ***
async function drawMain() {
  pageTitle = '빕다방의 메뉴' // 메인화면일 때의 타이틀 텍스트
  // 1. 템플릿 복사
  const frag = document.importNode(templates.productsForm, true)
  // 2. 요소 선택
  const productListEl = frag.querySelector('.products-list')
  // 3. 필요한 데이터 불러오기
  const { data: productsList } = await api.get('/products')
  // 4. 내용 채우기
  // 상품 목록 나열
  for (const productsItems of productsList){
    // 1. 템플릿 복사
    const frag = document.importNode(templates.productsItems, true)
    // 2. 요소 선택
    const thumbnailEl = frag.querySelector('.thumbnail')
    const nameEl = frag.querySelector('.name')
    const itemEl = frag.querySelector('.item')
    // 3. 필요한 데이터 불러오기
    // 4. 내용 채우기
    thumbnailEl.setAttribute('src', productsItems.mainImgUrl);
    nameEl.textContent = productsItems.title;
    // 5. 이벤트 리스너 등록하기
    itemEl.addEventListener("click", async e => {

      document.body.classList.add('loading-indicator'); // 로딩 인디케이터 추가
      drawDetail(productsItems.id);
      document.body.classList.remove('loading-indicator'); // 로딩 인디케이터 추가
    });
    // 6. 템플릿을 문서에 삽입
    productListEl.appendChild(frag)

  }
  // 5. 이벤트 리스너 등록하기
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent=''
  rootEl.appendChild(frag)
}


// *** 1. 로그인 화면 ***
async function drawLoginForm() {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.loginForm, true);
  // 2. 요소 선택
  const formEl = frag.querySelector(".login");
  const navigationEl = document.querySelector(".navigation"); // 로그인 화면에서 메뉴를 보이지않게 하기위해.
  // 3. 필요한 데이터 불러오기
  // 4. 내용 채우기
  pageTitle = "빕다방에 오신것을 환영합니다 :)"; // 페이지 타이틀 설정
  // 5. 이벤트 리스너 등록하기
  formEl.addEventListener("submit", async e => {
    document.body.classList.add('loading-indicator'); // 로딩 인디케이터 추가
    e.preventDefault();
    const username = e.target.elements.username.value;
    const password = e.target.elements.password.value;

    const res = await api.post("/users/login", {
      username,
      password
    });

    localStorage.setItem("token", res.data.token);
    drawMain();
    document.body.classList.remove('loading-indicator'); // 로딩 인디케이터 삭제
    alert(`${username}님 로그인 되었습니다.`);

    drawMain();
  });
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent = "";
  rootEl.appendChild(frag);

  // 로그인 화면에서 메뉴를 보이지않게 하기위한 작업
  // document.querySelector(".navigation").removeChild(document.querySelector('.menu-list'))

}

drawDetail(13);
// drawLoginForm();
// drawMain();

pageTitleEl.textContent = pageTitle; // 페이지별 타이틀

