document.addEventListener('DOMContentLoaded', () => {
    const allRoulettesContainer = document.getElementById('allRoulettesContainer');
    const addRouletteButton = document.getElementById('addRouletteButton');
    const LOCAL_STORAGE_KEY_PREFIX = 'rouletteItems_';
    const LOCAL_STORAGE_NAME_PREFIX = 'rouletteName_';

    // 오디오 요소 참조 가져오기
    const backgroundMusic = document.getElementById('backgroundMusic');
    const stopSound = document.getElementById('stopSound');

    let rouletteInstances = [];
    let nextRouletteId = 0;

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
            this.name = `룰렛 ${this.id + 1}`;

            this.isSpinning = false; // 룰렛 회전 중인지 여부
            this.currentRotation = 0; // 룰렛의 현재 회전 각도 (누적)

            this.createElements(); // DOM 요소 생성
            this.loadItemsAndName(); // 로컬 스토리지에서 항목과 이름 불러오기
            this.renderItems(); // 항목을 화면에 렌더링
            this.addEventListeners(); // 이벤트 리스너 추가
            this.updateRouletteNameDisplay(); // 룰렛 이름 디스플레이 업데이트
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
            this.spinButton.addEventListener('click', () => this.toggleSpin());
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
                return; // 이미 편집 모드이면 아무것도 안 함
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

            inputElement.addEventListener('blur', saveName, { once: true }); // 포커스 잃으면 저장
            
            inputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    inputElement.removeEventListener('blur', saveName); // blur 이벤트 중복 방지
                    saveName();
                }
            });
        }

        // 항목 목록을 화면에 렌더링하는 함수
        renderItems() {
            this.itemList.innerHTML = ''; // 기존 항목 초기화
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
            this.updateRouletteWheel(); // 항목이 변경될 때마다 룰렛 휠 업데이트
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
                if (!this.items.includes(item)) { // 이미 존재하는 항목이 아니라면 추가
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
            this.items.splice(index, 1); // 해당 인덱스의 항목 제거
            this.renderItems(); // 항목 목록 다시 렌더링
            this.resultText.textContent = '룰렛을 돌려보세요!';
        }

        // 룰렛 휠을 동적으로 생성하고 업데이트하는 함수
        updateRouletteWheel() {
            this.rouletteWheel.innerHTML = ''; // 기존 세그먼트 (텍스트 포함) 초기화

            if (this.items.length === 0) {
                this.rouletteWheel.style.background = '#ddd'; // 항목이 없으면 회색 배경
                return;
            }

            const anglePerItem = 360 / this.items.length; // 항목당 할당될 각도
            let gradientString = 'conic-gradient(from 0deg'; // 원뿔형 그라디언트 시작

            // 룰렛 배경 (conic-gradient) 생성
            let currentAngle = 0;
            this.items.forEach((item, index) => {
                const startAngle = currentAngle;
                const endAngle = currentAngle + anglePerItem;
                
                const colorIndex = index % colors.length; // 색상 배열 순환
                gradientString += `, ${colors[colorIndex]} ${startAngle}deg ${endAngle}deg`;
                currentAngle = endAngle;
            });
            gradientString += ')';
            this.rouletteWheel.style.background = gradientString;


            // 텍스트를 포함하는 개별 세그먼트 요소 생성 및 배치
            this.items.forEach((item, index) => {
                const segment = document.createElement('div');
                segment.classList.add('roulette-segment');
                
                // 각 세그먼트 요소를 회전시켜 해당 조각의 중심 방향으로 이동
                const segmentRotation = anglePerItem * index + (anglePerItem / 2);
                segment.style.transform = `rotate(${segmentRotation}deg)`;

                const itemText = document.createElement('div');
                itemText.classList.add('roulette-item-text');
                itemText.textContent = item;
                
                // 모든 텍스트를 0도 회전시켜 룰렛 중심을 향하게 고정 (세그먼트 자체는 회전하므로 텍스트는 다시 반대 방향으로 회전)
                itemText.style.setProperty('--text-rotation', `0deg`);

                segment.appendChild(itemText);
                this.rouletteWheel.appendChild(segment);
            });
            
            if (this.items.length === 1) {
                this.rouletteWheel.style.background = colors[0]; // 항목이 하나일 때는 단색으로 표시
            }
        }

        // 룰렛 회전 시작 (무한 회전 효과)
        startSpinning() {
            if (this.isSpinning) return; // 이미 돌고 있으면 중복 실행 방지

            this.isSpinning = true;
            this.spinButton.textContent = '룰렛 멈추기!';
            this.resultText.textContent = '룰렛이 돌아가고 있어요... 다시 클릭하면 멈춰요!';

            backgroundMusic.play().catch(e => console.error("배경 음악 재생 오류:", e));

            // 현재 룰렛의 실제 회전 각도를 가져옵니다.
            const style = window.getComputedStyle(this.rouletteWheel);
            const transformMatrix = new WebKitCSSMatrix(style.transform);
            // transformMatrix.m11 (a)와 transformMatrix.m12 (b)를 사용하여 각도 계산
            const currentMatrixAngle = Math.atan2(transformMatrix.m12, transformMatrix.m11) * (180 / Math.PI);
            this.currentRotation = (currentMatrixAngle + 360) % 360; // 0-360 범위로 정규화

            // 무한 회전을 위한 매우 큰 각도 설정 (예: 1000바퀴)
            const targetSpinDegrees = this.currentRotation + (360 * 1000); // 현재 각도에서 1000바퀴 더 돌림

            // 매우 긴 시간 동안 선형으로 회전하도록 transition 설정
            this.rouletteWheel.style.transition = 'transform 300s linear'; // 300초 동안 선형 회전
            this.rouletteWheel.style.transform = `rotate(${targetSpinDegrees}deg)`;
        }

        // 룰렛 멈추기
        stopSpinning() {
            if (!this.isSpinning) return; // 돌고 있지 않으면 중복 실행 방지

            this.isSpinning = false;
            this.spinButton.textContent = '룰렛 돌리기!';

            // 룰렛의 현재 회전 각도를 다시 가져옵니다. (transition이 적용된 상태에서 가져옴)
            const style = window.getComputedStyle(this.rouletteWheel);
            const transformMatrix = new WebKitCSSMatrix(style.transform);
            const currentMatrixAngle = Math.atan2(transformMatrix.m12, transformMatrix.m11) * (180 / Math.PI);
            this.currentRotation = (currentMatrixAngle + 360) % 360; // 0-360 범위로 정규화

            // 멈출 항목 결정
            const anglePerItem = 360 / this.items.length;

            // 마커는 룰렛의 최상단 (0도)에 위치합니다.
            // 룰렛은 시계 방향으로 회전하므로, 마커에 오게 할 항목의 각도를 계산할 때는 360도에서 현재 각도를 뺀 값으로 계산합니다.
            // (0도가 마커에 왔을 때 해당 항목이 당첨되는 방식)
            const adjustedAngleForMarker = (360 - this.currentRotation) % 360; // 룰렛의 0도가 마커에 오는 상대 각도
            const winningIndex = Math.floor(adjustedAngleForMarker / anglePerItem);
            const winningItem = this.items[winningIndex];

            // 당첨 항목의 중심 각도 (룰렛의 0도 기준)를 계산합니다.
            // 이 각도를 룰렛의 0도 위치(마커)로 가져와야 합니다.
            const targetItemCenterAngle = winningIndex * anglePerItem + (anglePerItem / 2);

            // 룰렛이 멈출 최종 각도를 계산합니다. (현재 룰렛의 총 회전 각도를 기준으로)
            // 룰렛은 시계 방향으로 계속 돌고 있으므로, 현재 총 회전 각도에서 목표하는 각도까지의 추가 회전량을 더합니다.
            // 최소 5바퀴를 더 돌린 후, 정확한 위치에 멈추도록 계산합니다.
            
            // 현재 회전 각도를 0-360 범위로 정규화한 'this.currentRotation'을 사용합니다.
            // 필요한 회전량은 (목표 항목의 중심 각도 - 현재 각도) 입니다.
            let neededRotation = targetItemCenterAngle - this.currentRotation;

            // 룰렛이 시계 방향으로 회전하므로, neededRotation이 음수가 되도록 조정하여 목표 항목이 마커에 도달하도록 합니다.
            // 예를 들어, 현재 룰렛이 30도 회전해 있고, 목표 항목의 중심이 15도에 있다면, 룰렛은 15도 더 회전해야 합니다.
            // 하지만 마커는 0도를 가리키므로, 룰렛을 -15도 회전시켜야 합니다.
            // 따라서 룰렛을 시계 반대 방향으로 추가 회전시키고, 최종적으로 마커에 오도록 합니다.
            // (마커는 0도에 고정되어 있으므로, 룰렛이 회전해서 목표 항목이 0도에 오도록 합니다.)
            // 목표 각도를 0도로 설정하고, 현재 각도와의 차이를 계산하여 필요한 추가 회전 각도를 구합니다.
            // 마커는 룰렛 '위에' 고정되어 있고, 룰렛 '자체'가 회전합니다.
            // 예를 들어, 룰렛이 30도 회전했을 때, 30도 위치에 있는 항목이 마커에 걸립니다.
            // 우리는 0도 위치에 있는 항목이 마커에 걸리게 하고 싶습니다.
            // 그러므로, 멈출 항목이 마커에 오도록 룰렛을 회전시키는 각도를 계산합니다.
            // 멈출 항목의 '시작' 각도를 찾아, 그 시작 각도가 마커(0도)에 오도록 회전시켜야 합니다.
            const angleToStop = (360 - (winningIndex * anglePerItem)) % 360; // 룰렛을 이 각도만큼 더 돌리면 당첨 항목의 시작점이 마커에 옴

            let finalStopAngle = this.currentRotation + (360 * 5) + angleToStop; // 현재 회전 + 최소 5바퀴 + 멈출 위치 조정

            // 현재 룰렛 휠의 transform 값을 가져와서 최종 각도를 부드럽게 이어붙입니다.
            // 이전에 'transform 300s linear'로 설정된 값을 바탕으로 현재 총 회전량을 가져와야 합니다.
            const currentComputedTransform = parseFloat(this.rouletteWheel.style.transform.replace('rotate(', '').replace('deg)', ''));
            // 이 currentComputedTransform 값은 360 * 1000 이나 그 이상일 수 있습니다.
            // 우리는 이 값을 기반으로 최종 정지 각도를 계산합니다.
            
            // 룰렛 휠의 현재 회전량을 정확하게 얻기 위한 임시 트랜지션
            this.rouletteWheel.style.transition = 'none'; // 잠시 트랜지션 제거
            this.rouletteWheel.style.transform = `rotate(${currentComputedTransform}deg)`; // 현재 위치 고정
            void this.rouletteWheel.offsetWidth; // DOM 강제 리플로우 (브라우저가 변경사항을 즉시 적용하게 함)


            // 여기서 currentRotation을 다시 계산하거나, 위에서 얻은 currentComputedTransform을 기준으로 목표 각도를 계산해야 합니다.
            // currentComputedTransform은 실제 누적된 회전 각도이므로 이것을 기준으로 계산하는 것이 더 정확합니다.
            const angleToStopRelativeToMarker = (360 - targetItemCenterAngle) % 360; // 마커에 오게 할 목표 각도
            let numRevolutions = Math.ceil((currentComputedTransform - angleToStopRelativeToMarker) / 360) + 5; // 최소 5바퀴 더 돌림
            if (numRevolutions < 5) numRevolutions = 5; // 최소 5바퀴 보장

            const targetFinalRotation = (numRevolutions * 360) + angleToStopRelativeToMarker;

            // 부드럽게 멈추는 애니메이션 적용
            this.rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)'; // 멈출 때의 트랜지션
            this.rouletteWheel.style.transform = `rotate(${targetFinalRotation}deg)`;

            // 룰렛이 완전히 멈추고 결과가 표시될 때 배경 음악 정지 및 초기화
            this.rouletteWheel.addEventListener('transitionend', () => {
                this.resultText.textContent = `🎉 ${winningItem} 🎉`;
                
                // 멈춘 후 최종 각도를 깔끔하게 정리 (나중에 다시 돌릴 때 초기화가 용이하도록)
                // 실제 최종 각도 (0-360 범위)를 적용하여 다음 스핀 시 부드럽게 시작하도록 함
                const actualFinalAngle = targetFinalRotation % 360;
                this.rouletteWheel.style.transition = 'none';
                this.rouletteWheel.style.transform = `rotate(${actualFinalAngle}deg)`;
                this.currentRotation = actualFinalAngle; // 현재 회전 각도 업데이트

                // 결과값 표시 시 효과음 재생
                stopSound.play().catch(e => console.error("정지 효과음 재생 오류:", e));

                // 룰렛 회전 정지 시 배경 음악 멈춤
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0; // 음악을 처음으로 되감기
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
                stopSound.play().catch(e => console.error("단일 항목 효과음 재생 오류:", e));
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
