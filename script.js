document.addEventListener('DOMContentLoaded', () => {
    const allRoulettesContainer = document.getElementById('allRoulettesContainer');
    const addRouletteButton = document.getElementById('addRouletteButton');
    const LOCAL_STORAGE_KEY_PREFIX = 'rouletteItems_'; // 룰렛별 고유 키를 위한 접두사
    const LOCAL_STORAGE_NAME_PREFIX = 'rouletteName_'; // 룰렛 이름 저장을 위한 새 접두사

    let rouletteInstances = []; // 모든 룰렛 인스턴스를 저장할 배열
    let nextRouletteId = 0; // 룰렛 ID를 위한 카운터

    const colors = [
        '#FFD700', '#FF6347', '#6A5ACD', '#3CB371', '#87CEEB',
        '#FF69B4', '#FFA07A', '#BA55D3', '#00CED1', '#F0E68C',
        '#ADFF2F', '#FF4500', '#DA70D6', '#20B2AA', '#7B68EE',
        '#FFC0CB', '#98FB98', '#ADD8E6', '#DDA0DD', '#FFDEAD'
    ];

    // 룰렛 클래스 정의
    class Roulette {
        constructor(id) {
            this.id = id;
            this.items = [];
            this.name = `룰렛 ${this.id + 1}`; // 기본 이름 설정

            this.isSpinning = false; // 룰렛이 돌고 있는지 여부
            // this.rotationInterval = null; // 이제 CSS 애니메이션을 사용하므로 필요 없음

            this.createElements();
            this.loadItemsAndName(); // 로컬 스토리지에서 항목과 이름 로드
            this.renderItems(); // 로드된 항목으로 렌더링
            this.addEventListeners();
            this.updateRouletteNameDisplay(); // 초기 이름 설정 (로드된 이름 적용)
        }

        // 룰렛 관련 DOM 요소들을 생성하고 컨테이너에 추가
        createElements() {
            this.container = document.createElement('div');
            this.container.classList.add('roulette-instance-container');
            this.container.dataset.rouletteId = this.id; // 데이터 ID 설정

            this.container.innerHTML = `
                <button class="delete-roulette-button">X</button>
                <h2>
                    <span class="roulette-title-display"></span>
                    <button class="edit-title-button"></button>
                </h2>
                <div class="input-section">
                    <input type="text" class="roulette-item-input" placeholder="항목 입력 (예: 1, 2, 3)">
                    <button class="add-item-button">추가</button>
                </div>
                <div class="item-list-section">
                    <h3>항목 목록</h3>
                    <ul class="item-list"></ul>
                </div>
                <button class="spin-button">룰렛 돌리기!</button>
                <div class="result-section">
                    <h3>결과</h3>
                    <div class="roulette-display-area">
                        <div class="roulette-wheel"></div>
                        <div class="marker"></div>
                    </div>
                    <p class="result-text">룰렛을 돌려보세요!</p>
                </div>
            `;
            allRoulettesContainer.appendChild(this.container);

            // 요소 참조
            this.rouletteItemInput = this.container.querySelector('.roulette-item-input');
            this.addItemButton = this.container.querySelector('.add-item-button');
            this.itemList = this.container.querySelector('.item-list');
            this.spinButton = this.container.querySelector('.spin-button');
            this.rouletteWheel = this.container.querySelector('.roulette-wheel');
            this.resultText = this.container.querySelector('.result-text');
            this.deleteRouletteButton = this.container.querySelector('.delete-roulette-button');
            // 새롭게 추가된 요소 참조
            this.rouletteTitleDisplay = this.container.querySelector('.roulette-title-display');
            this.editTitleButton = this.container.querySelector('.edit-title-button');

            // input placeholder 변경
            this.rouletteItemInput.placeholder = "항목 입력 (쉼표로 구분)";
        }

        // 이벤트 리스너 추가
        addEventListeners() {
            this.addItemButton.addEventListener('click', () => this.addItem());
            this.rouletteItemInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addItem();
                }
            });
            this.spinButton.addEventListener('click', () => this.toggleSpin()); // spinRoulette 대신 toggleSpin 호출
            this.deleteRouletteButton.addEventListener('click', () => this.deleteRoulette());

            this.rouletteTitleDisplay.addEventListener('click', () => this.toggleNameEditMode());
            this.editTitleButton.addEventListener('click', () => this.toggleNameEditMode());
        }

        // 로컬 스토리지에서 항목과 이름 불러오기
        loadItemsAndName() {
            const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + this.id);
            if (storedItems) {
                this.items = JSON.parse(storedItems);
            }
            const storedName = localStorage.getItem(LOCAL_STORAGE_NAME_PREFIX + this.id);
            if (storedName) {
                this.name = storedName;
            }
        }

        // 로컬 스토리지에 항목과 이름 저장하기
        saveItemsAndName() {
            localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + this.id, JSON.stringify(this.items));
            localStorage.setItem(LOCAL_STORAGE_NAME_PREFIX + this.id, this.name);
        }

        // 룰렛 이름 디스플레이 업데이트
        updateRouletteNameDisplay() {
            this.rouletteTitleDisplay.textContent = this.name;
        }

        // 이름 편집 모드 토글 함수
        toggleNameEditMode() {
            if (this.container.querySelector('.roulette-title-input')) {
                return;
            }

            this.rouletteTitleDisplay.style.display = 'none';
            this.editTitleButton.style.display = 'none';

            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.classList.add('roulette-title-input');
            inputElement.value = this.name;
            inputElement.placeholder = '룰렛 이름을 입력하세요';

            this.rouletteTitleDisplay.parentElement.insertBefore(inputElement, this.rouletteTitleDisplay.nextSibling);
            inputElement.focus();
            inputElement.select();

            const saveName = () => {
                const newName = inputElement.value.trim();
                if (newName) {
                    this.name = newName;
                }
                this.updateRouletteNameDisplay();
                this.saveItemsAndName();
                inputElement.remove();
                this.rouletteTitleDisplay.style.display = 'inline';
                this.editTitleButton.style.display = 'inline-flex';
            };

            inputElement.addEventListener('blur', saveName, { once: true });
            
            inputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    inputElement.removeEventListener('blur', saveName); 
                    saveName();
                }
            });
        }


        // 항목 목록을 화면에 렌더링하는 함수
        renderItems() {
            this.itemList.innerHTML = '';
            this.items.forEach((item, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = item;

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'X';
                deleteButton.classList.add('delete-btn');
                deleteButton.addEventListener('click', () => {
                    this.deleteItem(index);
                });

                listItem.appendChild(deleteButton);
                this.itemList.appendChild(listItem);
            });
            this.updateRouletteWheel();
            this.saveItemsAndName(); // 로컬 스토리지에 항목과 이름 저장
        }

        // 항목 추가 함수 (쉼표로 구분된 항목 처리)
        addItem() {
            const inputValue = this.rouletteItemInput.value.trim();
            if (!inputValue) {
                alert('룰렛에 추가할 항목을 입력해주세요!');
                return;
            }

            // 쉼표(,)로 구분된 문자열을 배열로 분리하고, 각 항목의 앞뒤 공백 제거 및 빈 항목 필터링
            const newItems = inputValue.split(',').map(item => item.trim()).filter(item => item !== '');
            
            let addedCount = 0;
            newItems.forEach(item => {
                if (!this.items.includes(item)) { // 이미 존재하는 항목이 아니라면
                    this.items.push(item);
                    addedCount++;
                }
            });

            if (addedCount > 0) { // 새로 추가된 항목이 있을 경우에만
                this.rouletteItemInput.value = ''; // 입력 필드 초기화
                this.renderItems(); // 항목 목록 다시 렌더링
                this.resultText.textContent = '룰렛을 돌려보세요!';
            } else {
                alert('추가할 새 항목이 없거나, 입력된 항목들이 이미 존재합니다!');
            }
        }

        // 항목 삭제 함수
        deleteItem(index) {
            this.items.splice(index, 1);
            this.renderItems();
            this.resultText.textContent = '룰렛을 돌려보세요!';
        }

        // 룰렛 휠을 동적으로 생성하고 업데이트하는 함수
        updateRouletteWheel() {
            this.rouletteWheel.innerHTML = ''; // 기존 세그먼트 (텍스트 포함) 초기화

            if (this.items.length === 0) {
                this.rouletteWheel.style.background = '#ddd';
                return;
            }

            const anglePerItem = 360 / this.items.length;
            let gradientString = 'conic-gradient(from 0deg';

            // 룰렛 배경 (conic-gradient) 생성
            let currentAngle = 0;
            this.items.forEach((item, index) => {
                const startAngle = currentAngle;
                const endAngle = currentAngle + anglePerItem;
                
                const colorIndex = index % colors.length;
                gradientString += `, ${colors[colorIndex]} ${startAngle}deg ${endAngle}deg`;
                currentAngle = endAngle;
            });
            gradientString += ')';
            this.rouletteWheel.style.background = gradientString;


            // 텍스트를 포함하는 개별 세그먼트 요소 생성 및 배치
            this.items.forEach((item, index) => {
                const segment = document.createElement('div');
                segment.classList.add('roulette-segment');
                
                // 각 세그먼트 요소 자체를 회전시켜 해당 조각의 중심 방향으로 이동
                const segmentRotation = anglePerItem * index + (anglePerItem / 2);
                segment.style.transform = `rotate(${segmentRotation}deg)`;

                const itemText = document.createElement('div');
                itemText.classList.add('roulette-item-text');
                itemText.textContent = item;
                
                // 모든 텍스트를 0도 회전시켜 룰렛 중심을 향하게 고정
                itemText.style.setProperty('--text-rotation', `0deg`);

                segment.appendChild(itemText);
                this.rouletteWheel.appendChild(segment);
            });
            
            if (this.items.length === 1) {
                this.rouletteWheel.style.background = colors[0]; // 항목이 하나일 때는 단색으로 표시
            }
        }

        // 룰렛 회전 시작 (무한 회전)
        startSpinning() {
            if (this.isSpinning) return; // 이미 돌고 있으면 중복 실행 방지

            this.isSpinning = true;
            this.spinButton.textContent = '룰렛 멈추기!';
            this.resultText.textContent = '룰렛이 돌아가고 있어요... 다시 클릭하면 멈춰요!';

            // 룰렛 휠의 현재 회전 각도를 가져와서 애니메이션 시작 지점으로 설정
            // 이렇게 해야 멈춘 상태에서 다시 돌릴 때 뚝 끊기지 않고 부드럽게 연결됩니다.
            const style = window.getComputedStyle(this.rouletteWheel);
            const matrix = style.transform;
            let currentRotation = 0;
            if (matrix !== 'none') {
                const values = matrix.split('(')[1].split(')')[0].split(',');
                const a = values[0];
                const b = values[1];
                currentRotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                if (currentRotation < 0) {
                    currentRotation += 360;
                }
            }

            this.rouletteWheel.style.transition = 'none'; // 기존 트랜지션 제거
            // 현재 각도에서 시작하여 360도 회전하는 애니메이션 적용
            this.rouletteWheel.style.transform = `rotate(${currentRotation}deg)`;
            void this.rouletteWheel.offsetWidth; // DOM 강제 리플로우
            
            this.rouletteWheel.style.animation = `spinInfinite 2s linear infinite`; // CSS 애니메이션 적용 (속도 조절 가능)
        }

        // 룰렛 멈추기
        stopSpinning() {
            if (!this.isSpinning) return; // 돌고 있지 않으면 중복 실행 방지

            this.isSpinning = false;
            this.spinButton.textContent = '룰렛 돌리기!';

            // 현재 룰렛의 회전 각도를 가져옵니다.
            const style = window.getComputedStyle(this.rouletteWheel);
            const matrix = style.transform;
            let currentAngle = 0;
            if (matrix !== 'none') {
                const values = matrix.split('(')[1].split(')')[0].split(',');
                const a = values[0];
                const b = values[1];
                currentAngle = Math.round(Math.atan2(b, a) * (180/Math.PI));
                // 음수 각도를 양수로 변환
                if (currentAngle < 0) {
                    currentAngle += 360;
                }
            }
            
            // CSS 애니메이션 제거
            this.rouletteWheel.style.animation = 'none';
            // 현재 각도 고정 (애니메이션 제거 후 룰렛이 처음 위치로 돌아가는 것 방지)
            this.rouletteWheel.style.transform = `rotate(${currentAngle}deg)`;
            void this.rouletteWheel.offsetWidth; // DOM 강제 리플로우

            // 멈출 항목 결정
            const anglePerItem = 360 / this.items.length;
            const adjustedAngle = (360 - currentAngle) % 360; // 룰렛의 0도가 마커에 오는 각도
            const winningIndex = Math.floor(adjustedAngle / anglePerItem);
            const winningItem = this.items[winningIndex];

            // 부드럽게 멈추는 애니메이션 적용
            // 룰렛을 현재 각도에서 최소 3바퀴 이상 돌린 후, 당첨 항목의 중심에 멈추도록 계산
            const targetAngleForStop = winningIndex * anglePerItem + (anglePerItem / 2); // 당첨 항목의 중심 각도
            let finalStopAngle = (360 * 5) + (360 - targetAngleForStop); // 5바퀴 + 멈출 위치
            finalStopAngle += (Math.random() * 10 - 5); // 약간의 무작위성

            this.rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)'; // 멈출 때의 트랜지션
            this.rouletteWheel.style.transform = `rotate(${finalStopAngle}deg)`;

            this.rouletteWheel.addEventListener('transitionend', () => {
                this.resultText.textContent = `🎉 ${winningItem} 🎉`;
                // 멈춘 후 최종 각도를 깔끔하게 정리 (나중에 다시 돌릴 때 초기화가 용이하도록)
                // 룰렛이 다시 돌 때 부드럽게 시작할 수 있도록 실제 최종 각도를 적용
                const actualFinalAngle = finalStopAngle % 360;
                this.rouletteWheel.style.transition = 'none';
                this.rouletteWheel.style.transform = `rotate(${actualFinalAngle}deg)`;
            }, { once: true });
        }

        // 룰렛 돌리기/멈추기 토글 함수
        toggleSpin() {
            if (this.items.length === 0) {
                alert('룰렛 항목이 없습니다. 항목을 추가해주세요!');
                return;
            }
            if (this.items.length === 1) {
                this.resultText.textContent = `🎉 ${this.items[0]} 🎉`;
                return;
            }

            if (this.isSpinning) {
                this.stopSpinning();
            } else {
                this.startSpinning();
            }
        }

        // 룰렛 삭제 함수
        deleteRoulette() {
            if (confirm('이 룰렛을 정말 삭제하시겠습니까?')) {
                this.container.remove(); // DOM에서 룰렛 컨테이너 제거
                localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + this.id); // 로컬 스토리지에서도 삭제
                localStorage.removeItem(LOCAL_STORAGE_NAME_PREFIX + this.id); // 이름도 함께 삭제
                // rouletteInstances 배열에서 이 룰렛 제거
                rouletteInstances = rouletteInstances.filter(r => r.id !== this.id);
            }
        }
    }

    // 새 룰렛을 생성하고 배열에 추가하는 함수
    const createNewRoulette = () => {
        const newRoulette = new Roulette(nextRouletteId++);
        rouletteInstances.push(newRoulette);
    };

    // 페이지 로드 시 기존 룰렛들 불러오기
    const loadAllRoulettes = () => {
        // 로컬 스토리지에 저장된 모든 룰렛 ID를 찾아 로드
        const rouletteIds = new Set(); // Set을 사용하여 중복 ID 방지
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // 항목과 이름 키 모두에서 ID를 추출
            if (key.startsWith(LOCAL_STORAGE_KEY_PREFIX) || key.startsWith(LOCAL_STORAGE_NAME_PREFIX)) {
                const idStr = key.replace(LOCAL_STORAGE_KEY_PREFIX, '').replace(LOCAL_STORAGE_NAME_PREFIX, '');
                const id = parseInt(idStr);
                if (!isNaN(id)) {
                    rouletteIds.add(id);
                }
            }
        }
        
        // ID 순서대로 룰렛 생성
        Array.from(rouletteIds).sort((a, b) => a - b).forEach(id => {
            const roulette = new Roulette(id);
            rouletteInstances.push(roulette);
            // nextRouletteId를 가장 큰 ID보다 크게 설정하여 중복 방지
            if (id >= nextRouletteId) {
                nextRouletteId = id + 1;
            }
        });

        // 만약 로드된 룰렛이 하나도 없다면, 기본 룰렛 하나 생성
        if (rouletteInstances.length === 0) {
            createNewRoulette();
        }
    };

    // '새 룰렛 만들기' 버튼 이벤트 리스너
    addRouletteButton.addEventListener('click', createNewRoulette);

    // 초기 로딩 시 모든 룰렛 불러오기
    loadAllRoulettes();
});