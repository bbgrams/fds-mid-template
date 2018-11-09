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
  loginForm: document.querySelector("#login-form").content,
  productsForm: document.querySelector("#products-form").content,
  productsItems: document.querySelector("#product-items").content,
  productsDetail: document.querySelector("#products-detail").content,
  detailSelectForm: document.querySelector("#detail-select-form").content,
  detailStateForm: document.querySelector("#detail-state-price-form").content,
  cartForm: document.querySelector("#cart-form").content,
  cartItemForm: document.querySelector("#cart-item").content,
};

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


// *** 4. 장바구니 ***
async function drawCart(){
  // 1. 템플릿 복사
  const frag = document.importNode(templates.cartForm, true)
  // 2. 요소 선택
  const tbodyEl = frag.querySelector('tbody')
  const cartBuyAllBtn = frag.querySelector(".cart-buy-all");
  // 3. 필요한 데이터 불러오기
  // cartList : 장바구니에 담긴 option 데이터객체를 포함한 배열
  const {data : cartList} = await api.get('/cartItems', {
    params : {
      _expand : "option",
      ordered : false
    }
  })
  const params = new URLSearchParams()
  cartList.forEach( c => {
    params.append('id', c.option.productId)
  })
  // productList : 장바구니에 담긴 optionId의 products 배열
  const {data:productList} = await api.get('/products?', {
    params
  })
  console.log(cartList)
  console.log(productList)
  // 4. 내용 채우기
  for(const cartItem of cartList){
    // cartList 배열에 저장된 아이템 개수만큼 tr을 추가할수있게 반복문을 돌린다
    // console.log(cartItem.quantity)
    const frag = document.importNode(templates.cartItemForm, true) // 1. 템플릿복사
    // 2. 요소 선택
    const cartImgEl = frag.querySelector('.cart-img-src')
    const cartTitleEl = frag.querySelector('.cart-title')
    const cartStateEl = frag.querySelector('.cart-state')
    const cartCountEl = frag.querySelector('.cart-count')
    const cartPriceEl = frag.querySelector('.cart-price')
    const cartDeleteBtn = frag.querySelector(".cart-delete-btn");
    // 3. 필요한 데이터 불러오기
    const productItem = productList.find(item => cartItem.option.productId === item.id)
    // 4. 내용 채우기
    cartImgEl.setAttribute("src", productItem.mainImgUrl);
    cartTitleEl.textContent = productItem.title;
    cartStateEl.textContent=cartItem.option.title
    cartCountEl.textContent=cartItem.quantity
    cartPriceEl.textContent=cartItem.option.price * cartItem.quantity
    // 5. 이벤트 리스너 등록하기
    // 삭제 버튼 클릭 시 삭제 진행
    cartDeleteBtn.addEventListener('click', async e => {
      e.preventDefault()
      console.log(cartItem)
      await api.delete('/cartItems/' + cartItem.id)
      drawCart()
    })
    // 6. 템플릿을 문서에 삽입
    tbodyEl.appendChild(frag)
  }
  // 5. 이벤트 리스너 등록하기
  cartBuyAllBtn.addEventListener('click', async e => {
    const {data : {id : orderId}} = await api.post('/orders', {
      orderTime : Date.now() // 현재 시각을 나타내는 정수
    })
    console.log(orderId)
    for (const cartItem of cartList){
      await api.patch('/cartItems/' + cartItem.id, {
        ordered : true,
        orderId
      })
    }
    alert('주문이 완료되었습니다.')
    // 주문 상세 페이지로 이동하기
  })
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent=''
  rootEl.appendChild(frag)
}


// *** 3. 상품 페이지 ***
async function drawDetail(productId){
// 1. 템플릿 복사
  const frag = document.importNode(templates.productsDetail, true)
// 2. 요소 선택
  const titleEl = frag.querySelector('.detail-title');
  const imgEl = frag.querySelector(".img");
  const infoEl = frag.querySelector('.detail-info')
  const detailSelectOptionEl = frag.querySelector(".detail-select-option");
  const detailPriceAll = frag.querySelector(".price-all");
  const detailCountEl = frag.querySelector('#buy-count')
  const detailPriceForm = frag.querySelector(".detail-price-form");
  const cartButton = frag.querySelector('.cart');
  let priceAll = 0;


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

  // options 배열을 순회하며 인덱스 갯수만큼 select 추가
  options.forEach((optionitem, index) => {
    const frag = document.importNode(templates.detailSelectForm, true); // 1.복사
    const frag2 = document.importNode(templates.detailStateForm, true);
    const selectOptionEl = frag.querySelector('option') // 2.요소 선택
    const stateEl= frag2.querySelector('.state')
    const statePriceEl = frag2.querySelector('.state-price')

    selectOptionEl.setAttribute('value', optionitem.id) // 3. 내용 채우기
    selectOptionEl.textContent = optionitem.title.toUpperCase()
    stateEl.textContent = optionitem.title.toUpperCase()
    statePriceEl.textContent = optionitem.price

    detailSelectOptionEl.appendChild(frag) // 4. 삽입
    detailPriceForm.appendChild(frag2)
  })

  detailSelectOptionEl.addEventListener('change', async e => {
    // select 요소에 선택이 일어났을때 이벤트 발생
    console.log(e.target.value)
    const {data : options} = await api.get(`/options/${e.target.value}`)
    priceAll = options.price * detailCountEl.value
    detailPriceAll.textContent = priceAll;
    console.log(priceAll)
  })
  detailCountEl.addEventListener('change', async e => {
    const { data: options } = await api.get(`/options/${detailSelectOptionEl.value}`)
    console.log(e.target.value)
    priceAll = e.target.value * options.price
    detailPriceAll.textContent = priceAll;
  })

  // 5. 이벤트 리스너 등록하기
  // 장바구니 담기
  cartButton.addEventListener('click', async e => {
    const quantity = parseInt(detailCountEl.value);
    const optionId = parseInt(detailSelectOptionEl.value);

    await api.post('/cartItems', {
      quantity,
      optionId,
      ordered:false
    })
    drawCart();

  })
  // 6. 템플릿을 문서에 삽입
  rootEl.textContent=''
  rootEl.appendChild(frag)

  // 총 금액 삽입
  detailPriceAll.textContent = priceAll;
}

/*** 2-2. 카테고리별 보기 ***/
async function drawCategoryList(category) {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.productsForm, true)
  // 2. 요소 선택
  const productListEl = frag.querySelector('.products-list')
  // 3. 필요한 데이터 불러오기
  const { data: productsList } = await api.get('/products?category=' + category)
  // 4. 내용 채우기

  // 상품 목록 나열
  for (const productsItems of productsList) {
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
  rootEl.textContent = ''
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
}
// 메인 메뉴 선택 시 이동
document.querySelector('.category-coffee').addEventListener('click',  e =>{
  drawCategoryList("coffee");
})
document.querySelector('.category-drink').addEventListener('click',  e =>{
  drawCategoryList("drink");
})
document.querySelector(".category-icecream").addEventListener("click", e => {
  drawCategoryList("icecream");
});
document.querySelector('.category-ccino').addEventListener('click',  e =>{
  drawCategoryList("ccino");
})
// drawCart()
// drawDetail(10);
// drawLoginForm();
drawMain();


pageTitleEl.textContent = pageTitle; // 페이지별 타이틀






// # 해야 될 것.
// - 상품 상세페이지에서 +,- 버튼 누르면 수량 증가, 감소
// - 상품 상세페이지에서 수량이 0 이하거나 음수일 때 알럿창 띄우기.
