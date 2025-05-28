document.addEventListener('DOMContentLoaded', () => {
    const allRoulettesContainer = document.getElementById('allRoulettesContainer');
    const addRouletteButton = document.getElementById('addRouletteButton');
    const settingsButton = document.getElementById('settingsButton');
    const developerSettingsButton = document.getElementById('developerSettingsButton');

    const musicSettingsModal = document.getElementById('musicSettingsModal');
    const closeMusicButton = musicSettingsModal.querySelector('.close-button');

    const developerSettingsModal = document.getElementById('developerSettingsModal');
    const closeDeveloperButton = developerSettingsModal.querySelector('.close-button.developer-close-button');

    const saveMusicSettingsButton = document.getElementById('saveMusicSettings');
    const saveDeveloperSettingsButton = document.getElementById('saveDeveloperSettings');

    const musicOptions = musicSettingsModal.querySelector('.music-options');
    const probabilitySettingsList = document.getElementById('probabilitySettingsList');

    const LOCAL_STORAGE_KEY_PREFIX = 'rouletteItems_';
    const LOCAL_STORAGE_NAME_PREFIX = 'rouletteName_';
    const LOCAL_STORAGE_MUSIC_KEY = 'selectedBackgroundMusic';
    const LOCAL_STORAGE_PROBABILITY_PREFIX = 'rouletteProbabilities_';
    // 새롭게 추가된 로컬 스토리지 키
    const LOCAL_STORAGE_DRAWN_ITEMS_PREFIX = 'rouletteDrawnItems_';
    const LOCAL_STORAGE_HIDE_DRAWN_ITEMS_PREFIX = 'rouletteHideDrawnItems_';


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

    const LOCKED_MUSIC_PASSWORD = 'skyty0802kangty';
    const LOCKED_MUSIC_VALUE = 'music4.mp3';
    const DEVELOPER_PASSWORD = 'skyty0802developer';

    class Roulette {
        constructor(id) {
            this.id = id;
            this.items = [];
            this.name = `룰렛 ${this.id + 1}`;
            this.probabilities = {};
            this.drawnItems = []; // 새로 추가: 나온 항목을 저장할 배열
            this.hideDrawnItems = false; // 새로 추가: 나온 항목 숨기기 상태

            this.isSpinning = false;
            this.currentRotation = 0;

            this.createElements();
            this.loadItemsAndName();
            this.loadProbabilities();
            this.renderItems(); // 룰렛 항목 렌더링 시점에 drawnItems 적용
            this.addEventListeners();
            this.updateRouletteNameDisplay();
            this.handleDrawnItemsVisibility(); // 초기 로드 시 나온 항목 숨기기 적용
        }

        createElements() {
            this.container = document.createElement('div');
            this.container.classList.add('roulette-instance-container');
            this.container.dataset.rouletteId = this.id;

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
                <div class="drawn-items-section">
                    <h3>나온 항목</h3>
                    <div class="drawn-items-controls">
                        <label>
                            <input type="checkbox" class="hide-drawn-items-checkbox"> 나온 항목 숨기기
                        </label>
                        <button class="reset-drawn-items-button">항목 초기화</button>
                    </div>
                    <ul class="drawn-item-list"></ul>
                </div>
            `;
            allRoulettesContainer.appendChild(this.container);

            this.rouletteItemInput = this.container.querySelector('.roulette-item-input');
            this.addItemButton = this.container.querySelector('.add-item-button');
            this.itemList = this.container.querySelector('.item-list');
            this.spinButton = this.container.querySelector('.spin-button');
            this.rouletteWheel = this.container.querySelector('.roulette-wheel');
            this.resultText = this.container.querySelector('.result-text');
            this.deleteRouletteButton = this.container.querySelector('.delete-roulette-button');
            this.rouletteTitleDisplay = this.container.querySelector('.roulette-title-display');
            this.editTitleButton = this.container.querySelector('.edit-title-button');

            // 새로 추가된 요소들
            this.drawnItemsList = this.container.querySelector('.drawn-item-list');
            this.hideDrawnItemsCheckbox = this.container.querySelector('.hide-drawn-items-checkbox');
            this.resetDrawnItemsButton = this.container.querySelector('.reset-drawn-items-button');

            this.rouletteItemInput.placeholder = "항목 입력 (쉼표로 구분)";
        }

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

            // 새로 추가된 이벤트 리스너
            this.hideDrawnItemsCheckbox.addEventListener('change', () => {
                this.hideDrawnItems = this.hideDrawnItemsCheckbox.checked;
                this.saveItemsAndName(); // 체크박스 상태 저장
                this.handleDrawnItemsVisibility(); // 가시성 즉시 적용
            });
            this.resetDrawnItemsButton.addEventListener('click', () => this.resetDrawnItems());
        }

        loadItemsAndName() {
            const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + this.id);
            if (storedItems) {
                this.items = JSON.parse(storedItems);
            }
            const storedName = localStorage.getItem(LOCAL_STORAGE_NAME_PREFIX + this.id);
            if (storedName) {
                this.name = storedName;
            }
            // 나온 항목과 숨기기 상태 로드
            const storedDrawnItems = localStorage.getItem(LOCAL_STORAGE_DRAWN_ITEMS_PREFIX + this.id);
            if (storedDrawnItems) {
                this.drawnItems = JSON.parse(storedDrawnItems);
            }
            const storedHideDrawnItems = localStorage.getItem(LOCAL_STORAGE_HIDE_DRAWN_ITEMS_PREFIX + this.id);
            if (storedHideDrawnItems !== null) {
                this.hideDrawnItems = JSON.parse(storedHideDrawnItems);
                this.hideDrawnItemsCheckbox.checked = this.hideDrawnItems;
            }
        }

        saveItemsAndName() {
            localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + this.id, JSON.stringify(this.items));
            localStorage.setItem(LOCAL_STORAGE_NAME_PREFIX + this.id, this.name);
            // 나온 항목과 숨기기 상태 저장
            localStorage.setItem(LOCAL_STORAGE_DRAWN_ITEMS_PREFIX + this.id, JSON.stringify(this.drawnItems));
            localStorage.setItem(LOCAL_STORAGE_HIDE_DRAWN_ITEMS_PREFIX + this.id, JSON.stringify(this.hideDrawnItems));
        }

        loadProbabilities() {
            const storedProbabilities = localStorage.getItem(LOCAL_STORAGE_PROBABILITY_PREFIX + this.id);
            if (storedProbabilities) {
                this.probabilities = JSON.parse(storedProbabilities);
            } else {
                this.items.forEach(item => {
                    if (!this.probabilities[item]) {
                        this.probabilities[item] = 1;
                    }
                });
                this.saveProbabilities();
            }
        }

        saveProbabilities() {
            localStorage.setItem(LOCAL_STORAGE_PROBABILITY_PREFIX + this.id, JSON.stringify(this.probabilities));
        }

        getWeightedItems() {
            const weightedItems = [];
            let totalWeight = 0;

            // hideDrawnItems가 true일 경우, drawnItems에 없는 항목만 포함
            const itemsToConsider = this.hideDrawnItems
                ? this.items.filter(item => !this.drawnItems.includes(item))
                : this.items;

            itemsToConsider.forEach(item => {
                const weight = this.probabilities[item] || 0;
                if (weight > 0) {
                    weightedItems.push({ item: item, weight: weight });
                    totalWeight += weight;
                }
            });

            // 만약 고려할 항목이 없지만 원래 아이템은 있을 경우 (예: 모두 숨김 처리됨),
            // 이 경우 전체 아이템을 기본 가중치로 포함하여 룰렛이 돌도록 합니다.
            if (totalWeight === 0 && this.items.length > 0) {
                 // 그러나 이 경우에도 숨겨진 항목은 제외해야 합니다.
                const fallbackItems = this.items.filter(item => !this.drawnItems.includes(item));
                if (fallbackItems.length > 0) {
                    fallbackItems.forEach(item => {
                        weightedItems.push({ item: item, weight: 1 });
                    });
                    totalWeight = fallbackItems.length;
                }
            }


            return { weightedItems, totalWeight };
        }

        updateRouletteNameDisplay() {
            this.rouletteTitleDisplay.textContent = this.name;
        }

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

        renderItems() {
            this.itemList.innerHTML = '';
            this.items.forEach((item, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = item;

                // 숨겨진 항목일 경우 CSS 클래스 추가
                if (this.hideDrawnItems && this.drawnItems.includes(item)) {
                    listItem.classList.add('hidden-drawn-item');
                }

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
            this.saveItemsAndName();
            this.saveProbabilities();
            this.renderDrawnItemsList(); // 나온 항목 목록도 업데이트
        }

        addItem() {
            const inputValue = this.rouletteItemInput.value.trim();
            if (!inputValue) {
                alert('룰렛에 추가할 항목을 입력해주세요!');
                return;
            }

            const newItems = inputValue.split(',').map(item => item.trim()).filter(item => item !== '');

            let addedCount = 0;
            newItems.forEach(item => {
                if (!this.items.includes(item)) {
                    this.items.push(item);
                    this.probabilities[item] = 1;
                    addedCount++;
                    // 새로운 항목이 추가되면 drawnItems에서 해당 항목을 제거 (만약 이전에 나온 항목이었다면)
                    this.drawnItems = this.drawnItems.filter(drawn => drawn !== item);
                }
            });

            if (addedCount > 0) {
                this.rouletteItemInput.value = '';
                this.renderItems();
                this.resultText.textContent = '룰렛을 돌려보세요!';
            } else {
                alert('추가할 새 항목이 없거나, 입력된 항목들이 이미 존재합니다!');
            }
        }

        deleteItem(index) {
            const deletedItem = this.items[index];
            this.items.splice(index, 1);
            delete this.probabilities[deletedItem];
            // 나온 항목 목록에서도 제거
            this.drawnItems = this.drawnItems.filter(item => item !== deletedItem);
            this.renderItems();
            this.resultText.textContent = '룰렛을 돌려보세요!';
        }

        updateRouletteWheel() {
            this.rouletteWheel.innerHTML = '';

            const { weightedItems, totalWeight } = this.getWeightedItems(); // 숨겨진 항목이 제외된 weightedItems

            if (weightedItems.length === 0) {
                this.rouletteWheel.style.background = '#ddd';
                this.resultText.textContent = "룰렛 항목이 없거나 모든 항목의 확률이 0이거나 모두 숨겨진 항목입니다!";
                return;
            }

            let gradientString = 'conic-gradient(from 0deg';
            let currentAngle = 0;

            weightedItems.forEach((wItem, index) => {
                const angle = (wItem.weight / totalWeight) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;

                const colorIndex = index % colors.length;
                gradientString += `, ${colors[colorIndex]} ${startAngle}deg ${endAngle}deg`;
                currentAngle = endAngle;
            });
            gradientString += ')';
            this.rouletteWheel.style.background = gradientString;

            let textCurrentAngle = 0;
            weightedItems.forEach((wItem) => {
                const angle = (wItem.weight / totalWeight) * 360;
                const segment = document.createElement('div');
                segment.classList.add('roulette-segment');

                const segmentRotation = textCurrentAngle + (angle / 2);
                segment.style.transform = `rotate(${segmentRotation}deg)`;

                const itemText = document.createElement('div');
                itemText.classList.add('roulette-item-text');
                itemText.textContent = wItem.item;

                itemText.style.setProperty('--text-rotation', `0deg`);

                segment.appendChild(itemText);
                this.rouletteWheel.appendChild(segment);
                textCurrentAngle += angle;
            });

            if (weightedItems.length === 1) {
                this.rouletteWheel.style.background = colors[0];
            }
        }

        startSpinning() {
            if (this.isSpinning) return;

            const { weightedItems, totalWeight } = this.getWeightedItems();
            if (weightedItems.length === 0) {
                alert('룰렛 항목이 없거나 모든 항목의 확률이 0이거나 모두 숨겨진 항목입니다. 항목을 추가하거나 확률을 조정해주세요!');
                return;
            }

            this.isSpinning = true;
            this.spinButton.textContent = '룰렛 멈추기!';
            this.resultText.textContent = '룰렛이 돌아가고 있어요... 다시 클릭하면 멈춰요!';

            backgroundMusic.play().catch(e => console.error("배경 음악 재생 오류:", e));

            const style = window.getComputedStyle(this.rouletteWheel);
            const transformMatrix = new WebKitCSSMatrix(style.transform);
            const currentMatrixAngle = Math.atan2(transformMatrix.m12, transformMatrix.m11) * (180 / Math.PI);
            this.currentRotation = (currentMatrixAngle + 360) % 360;

            const targetSpinDegrees = this.currentRotation + (360 * 500);

            this.rouletteWheel.style.transition = 'transform 300s linear';
            this.rouletteWheel.style.transform = `rotate(${targetSpinDegrees}deg)`;

            // 룰렛을 돌리기 시작할 때, hideDrawnItems가 true라면 나온 항목들을 숨깁니다.
            if (this.hideDrawnItems) {
                this.updateRouletteWheel(); // 룰렛 휠에서 숨겨진 항목을 적용
                this.renderItems(); // 항목 목록에서 숨겨진 항목을 적용
            }
        }

        stopSpinning() {
            if (!this.isSpinning) return;

            this.isSpinning = false;
            this.spinButton.textContent = '룰렛 돌리기!';

            const style = window.getComputedStyle(this.rouletteWheel);
            const transformMatrix = new WebKitCSSMatrix(style.transform);
            const currentComputedRotation = Math.atan2(transformMatrix.m12, transformMatrix.m11) * (180 / Math.PI);

            this.rouletteWheel.style.transition = 'none';
            this.rouletteWheel.style.transform = `rotate(${currentComputedRotation}deg)`;
            void this.rouletteWheel.offsetWidth;

            const { weightedItems, totalWeight } = this.getWeightedItems();
            if (weightedItems.length === 0) {
                this.resultText.textContent = "룰렛 항목이 없거나 모든 항목의 확률이 0이거나 모두 숨겨진 항목입니다!";
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
                return;
            }

            let randomNumber = Math.random() * totalWeight;
            let winningItem = null;
            let winningItemAngleStart = 0;
            let winningItemAngleSize = 0;

            for (let i = 0; i < weightedItems.length; i++) {
                const wItem = weightedItems[i];
                const itemAngle = (wItem.weight / totalWeight) * 360;
                if (randomNumber < wItem.weight) {
                    winningItem = wItem.item;
                    winningItemAngleStart = weightedItems.slice(0, i).reduce((sum, current) => sum + (current.weight / totalWeight) * 360, 0);
                    winningItemAngleSize = itemAngle;
                    break;
                }
                randomNumber -= wItem.weight;
            }

            const targetItemCenterAngle = winningItemAngleStart + (winningItemAngleSize / 2);
            const angleToAlignWithMarker = (360 - targetItemCenterAngle) % 360;

            let numRevolutions = Math.ceil((currentComputedRotation - angleToAlignWithMarker) / 360) + 5;
            if (numRevolutions < 5) numRevolutions = 5;

            const targetFinalRotation = (numRevolutions * 360) + angleToAlignWithMarker;

            this.rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
            this.rouletteWheel.style.transform = `rotate(${targetFinalRotation}deg)`;

            this.rouletteWheel.addEventListener('transitionend', () => {
                this.resultText.textContent = `🎉 ${winningItem} 🎉`;

                // 당첨된 항목을 나온 항목 리스트에 추가
                if (winningItem && !this.drawnItems.includes(winningItem)) {
                    this.drawnItems.push(winningItem);
                    this.saveItemsAndName(); // 나온 항목 리스트 저장
                    this.renderDrawnItemsList(); // 나온 항목 목록 업데이트
                }

                const actualFinalAngle = targetFinalRotation % 360;
                this.rouletteWheel.style.transition = 'none';
                this.rouletteWheel.style.transform = `rotate(${actualFinalAngle}deg)`;
                this.currentRotation = actualFinalAngle;

                stopSound.play().catch(e => console.error("정지 효과음 재생 오류:", e));

                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
            }, { once: true });
        }

        toggleSpin() {
            const { weightedItems } = this.getWeightedItems();
            if (weightedItems.length === 0) {
                alert('룰렛 항목이 없거나 모든 항목의 확률이 0이거나 모두 숨겨진 항목입니다. 항목을 추가하거나 확률을 조정해주세요!');
                return;
            }
            if (weightedItems.length === 1) {
                this.resultText.textContent = `🎉 ${weightedItems[0].item} 🎉`;
                stopSound.play().catch(e => console.error("단일 항목 효과음 재생 오류:", e));
                return;
            }

            if (this.isSpinning) {
                this.stopSpinning();
            } else {
                this.startSpinning();
            }
        }

        deleteRoulette() {
            if (confirm('이 룰렛을 정말 삭제하시겠습니까?')) {
                this.container.remove();
                localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + this.id);
                localStorage.removeItem(LOCAL_STORAGE_NAME_PREFIX + this.id);
                localStorage.removeItem(LOCAL_STORAGE_PROBABILITY_PREFIX + this.id);
                localStorage.removeItem(LOCAL_STORAGE_DRAWN_ITEMS_PREFIX + this.id); // 나온 항목 삭제
                localStorage.removeItem(LOCAL_STORAGE_HIDE_DRAWN_ITEMS_PREFIX + this.id); // 숨기기 상태 삭제

                rouletteInstances = rouletteInstances.filter(r => r.id !== this.id);
            }
        }

        // 새로 추가된 함수: 나온 항목 목록을 렌더링
        renderDrawnItemsList() {
            this.drawnItemsList.innerHTML = '';
            if (this.drawnItems.length === 0) {
                const listItem = document.createElement('li');
                listItem.textContent = '아직 나온 항목이 없습니다.';
                listItem.style.fontStyle = 'italic';
                this.drawnItemsList.appendChild(listItem);
                return;
            }
            this.drawnItems.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = item;
                this.drawnItemsList.appendChild(listItem);
            });
        }

        // 새로 추가된 함수: 나온 항목의 가시성 처리
        handleDrawnItemsVisibility() {
            // 룰렛 휠 업데이트 (숨김 설정에 따라 항목이 제거됨)
            this.updateRouletteWheel();

            // 항목 목록 업데이트 (숨김 설정에 따라 CSS 클래스 추가/제거)
            const allListItems = this.itemList.querySelectorAll('li');
            allListItems.forEach(listItem => {
                const itemText = listItem.textContent.replace('X', '').trim(); // 'X' 버튼 텍스트 제외
                if (this.hideDrawnItems && this.drawnItems.includes(itemText)) {
                    listItem.classList.add('hidden-drawn-item');
                } else {
                    listItem.classList.remove('hidden-drawn-item');
                }
            });
            this.saveItemsAndName(); // 가시성 상태 저장
        }

        // 새로 추가된 함수: 나온 항목 초기화
        resetDrawnItems() {
            if (confirm('나온 항목 목록을 초기화하시겠습니까? (숨겨진 항목들도 다시 표시됩니다.)')) {
                this.drawnItems = [];
                this.saveItemsAndName(); // 나온 항목 초기화 상태 저장
                this.renderDrawnItemsList(); // 나온 항목 목록 업데이트
                this.handleDrawnItemsVisibility(); // 모든 항목 다시 표시
                this.resultText.textContent = '룰렛을 돌려보세요!';
            }
        }
    }

    const createNewRoulette = () => {
        const newRoulette = new Roulette(nextRouletteId++);
        rouletteInstances.push(newRoulette);
    };

    const loadAllRoulettes = () => {
        const rouletteIds = new Set();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // 모든 룰렛 관련 로컬 스토리지 키를 검사하여 ID 추출
            if (key.startsWith(LOCAL_STORAGE_KEY_PREFIX) ||
                key.startsWith(LOCAL_STORAGE_NAME_PREFIX) ||
                key.startsWith(LOCAL_STORAGE_PROBABILITY_PREFIX) ||
                key.startsWith(LOCAL_STORAGE_DRAWN_ITEMS_PREFIX) ||
                key.startsWith(LOCAL_STORAGE_HIDE_DRAWN_ITEMS_PREFIX)
            ) {
                const idStr = key
                    .replace(LOCAL_STORAGE_KEY_PREFIX, '')
                    .replace(LOCAL_STORAGE_NAME_PREFIX, '')
                    .replace(LOCAL_STORAGE_PROBABILITY_PREFIX, '')
                    .replace(LOCAL_STORAGE_DRAWN_ITEMS_PREFIX, '')
                    .replace(LOCAL_STORAGE_HIDE_DRAWN_ITEMS_PREFIX, '');

                const id = parseInt(idStr);
                if (!isNaN(id)) {
                    rouletteIds.add(id);
                }
            }
        }

        Array.from(rouletteIds).sort((a, b) => a - b).forEach(id => {
            const roulette = new Roulette(id);
            rouletteInstances.push(roulette);
            if (id >= nextRouletteId) {
                nextRouletteId = id + 1;
            }
        });

        if (rouletteInstances.length === 0) {
            createNewRoulette();
        }
    };

    const openMusicSettingsModal = () => {
        musicSettingsModal.style.display = 'flex';
        const currentMusic = localStorage.getItem(LOCAL_STORAGE_MUSIC_KEY) || 'background_music.mp3';
        const radioButtons = musicOptions.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            if (radio.value === currentMusic) {
                radio.checked = true;
            }
        });
    };

    const closeMusicSettingsModal = () => {
        musicSettingsModal.style.display = 'none';
    };

    const saveMusicSettings = () => {
        const selectedMusic = musicOptions.querySelector('input[name="bgMusic"]:checked');
        if (selectedMusic) {
            const musicPath = selectedMusic.value;

            if (musicPath === LOCKED_MUSIC_VALUE) {
                const password = prompt('잠긴 노래입니다. 비밀번호를 입력하세요:');
                if (password !== LOCKED_MUSIC_PASSWORD) {
                    alert('비밀번호가 올바르지 않습니다.');
                    const currentMusic = localStorage.getItem(LOCAL_STORAGE_MUSIC_KEY) || 'background_music.mp3';
                    const radioButtons = musicOptions.querySelectorAll('input[type="radio"]');
                    radioButtons.forEach(radio => {
                        if (radio.value === currentMusic) {
                            radio.checked = true;
                        } else {
                            radio.checked = false;
                        }
                    });
                    return;
                }
            }
            localStorage.setItem(LOCAL_STORAGE_MUSIC_KEY, musicPath);
            backgroundMusic.src = musicPath;
            backgroundMusic.load();
            if (rouletteInstances.some(r => r.isSpinning)) {
                backgroundMusic.play().catch(e => console.error("음악 변경 후 재생 오류:", e));
            }
            alert('배경 음악 설정이 저장되었습니다.');
            closeMusicSettingsModal();
        } else {
            alert('재생할 배경 음악을 선택해주세요.');
        }
    };

    const loadSelectedMusic = () => {
        const storedMusic = localStorage.getItem(LOCAL_STORAGE_MUSIC_KEY);
        if (storedMusic) {
            backgroundMusic.src = storedMusic;
            backgroundMusic.load();
        }
    };

    const openDeveloperSettingsModal = () => {
        const password = prompt('개발자 설정입니다. 비밀번호를 입력하세요:');
        if (password === DEVELOPER_PASSWORD) {
            developerSettingsModal.style.display = 'flex';
            renderProbabilitySettings();
        } else {
            alert('비밀번호가 올바르지 않습니다.');
        }
    };

    const closeDeveloperSettingsModal = () => {
        developerSettingsModal.style.display = 'none';
    };

    const renderProbabilitySettings = () => {
        probabilitySettingsList.innerHTML = '';

        if (rouletteInstances.length === 0) {
            probabilitySettingsList.innerHTML = '<p>생성된 룰렛이 없습니다.</p>';
            return;
        }

        rouletteInstances.forEach(roulette => {
            const rouletteDiv = document.createElement('div');
            rouletteDiv.classList.add('roulette-probability-item');
            rouletteDiv.dataset.rouletteId = roulette.id;

            const rouletteTitle = document.createElement('h3');
            rouletteTitle.textContent = roulette.name;
            rouletteDiv.appendChild(rouletteTitle);

            if (roulette.items.length === 0) {
                const noItemsText = document.createElement('p');
                noItemsText.textContent = '이 룰렛에는 항목이 없습니다.';
                rouletteDiv.appendChild(noItemsText);
            } else {
                roulette.items.forEach(item => {
                    const itemProbDiv = document.createElement('div');
                    itemProbDiv.classList.add('item-probability');

                    const label = document.createElement('label');
                    label.textContent = `${item} 확률:`;
                    itemProbDiv.appendChild(label);

                    const input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.value = roulette.probabilities[item] || 1;
                    input.dataset.item = item;
                    input.dataset.rouletteId = roulette.id;
                    itemProbDiv.appendChild(input);

                    rouletteDiv.appendChild(itemProbDiv);
                });
            }
            probabilitySettingsList.appendChild(rouletteDiv);
        });
    };

    const saveDeveloperSettings = () => {
        rouletteInstances.forEach(roulette => {
            let changesMade = false;
            const rouletteProbElements = probabilitySettingsList.querySelectorAll(`.roulette-probability-item[data-roulette-id="${roulette.id}"] .item-probability input`);

            rouletteProbElements.forEach(input => {
                const item = input.dataset.item;
                const newProbability = parseInt(input.value);

                if (!isNaN(newProbability) && newProbability >= 0 && roulette.probabilities[item] !== newProbability) {
                    roulette.probabilities[item] = newProbability;
                    changesMade = true;
                } else if (isNaN(newProbability) || newProbability < 0) {
                    roulette.probabilities[item] = 1;
                    input.value = 1;
                    changesMade = true;
                }
            });

            if (changesMade) {
                roulette.saveProbabilities();
                roulette.updateRouletteWheel();
            }
        });
        alert('개발자 설정이 저장되었습니다.');
        closeDeveloperSettingsModal();
    };

    addRouletteButton.addEventListener('click', createNewRoulette);
    settingsButton.addEventListener('click', openMusicSettingsModal);
    developerSettingsButton.addEventListener('click', openDeveloperSettingsModal);

    closeMusicButton.addEventListener('click', closeMusicSettingsModal);
    closeDeveloperButton.addEventListener('click', closeDeveloperSettingsModal);

    window.addEventListener('click', (event) => {
        if (event.target === musicSettingsModal) {
            closeMusicSettingsModal();
        }
        if (event.target === developerSettingsModal) {
            closeDeveloperSettingsModal();
        }
    });

    saveMusicSettingsButton.addEventListener('click', saveMusicSettings);
    saveDeveloperSettingsButton.addEventListener('click', saveDeveloperSettings);

    loadAllRoulettes();
    loadSelectedMusic();
});
