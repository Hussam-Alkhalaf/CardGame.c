class CardGame {
    constructor() {
        this.cards = [];
        this.round = 0;
        this.deckId = null;
        this.initialize();
    }

    async initialize() {
        await this.fetchDeck();
        await this.drawCards();
        this.updateUI();
    }

    async fetchDeck() {
        try {
            const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/');
            const data = await response.json();
            this.deckId = data.deck_id;
        } catch (error) {
            console.error('Fehler beim Abrufen des Decks:', error);
            alert('Fehler beim Abrufen des Decks. Bitte Seite neu laden.');
        }
    }

    async drawCards() {
        try {
            const drawResponse = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=21`);
            const cardData = await drawResponse.json();
            this.cards = cardData.cards;
            document.getElementById('loadingScreen').style.display = 'none';
        } catch (error) {
            console.error('Fehler beim Laden der Karten:', error);
            alert('Fehler beim Laden der Karten. Bitte Seite neu laden.');
        }
    }

    async scatterCards() {
        const container = document.getElementById('scatterContainer');
        const gameContainer = document.getElementById('gameContainer');
        
        container.style.display = 'block';
        gameContainer.classList.add('hidden');
        container.innerHTML = '';

        this.cards.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'scattered-card';
            
            const x = Math.random() * (window.innerWidth - 150);
            const y = Math.random() * (window.innerHeight - 200);
            const rotation = Math.random() * 360 - 180;
            
            cardDiv.style.setProperty('--x', `${x}px`);
            cardDiv.style.setProperty('--y', `${y}px`);
            cardDiv.style.setProperty('--rotation', `${rotation}deg`);
            
            const img = document.createElement('img');
            img.src = card.image;
            img.alt = card.code;
            
            cardDiv.appendChild(img);
            container.appendChild(cardDiv);
            
            setTimeout(() => cardDiv.classList.add('active'), 50 * index);
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const cards = document.querySelectorAll('.scattered-card');
        cards.forEach(card => card.classList.add('collect'));

        await new Promise(resolve => setTimeout(resolve, 1000));
        container.style.display = 'none';
    }

    getColumns() {
        const columns = [[], [], []];
        this.cards.forEach((card, index) => {
            columns[index % 3].push(card);
        });
        return columns;
    }

    async handleColumnSelection(selectedColumn) {
        const columns = this.getColumns();
        let newOrder = [];
        
        if (selectedColumn === 1) {
            newOrder = [...columns[1], ...columns[0], ...columns[2]];
        } else if (selectedColumn === 2) {
            newOrder = [...columns[0], ...columns[1], ...columns[2]];
        } else {
            newOrder = [...columns[0], ...columns[2], ...columns[1]];
        }

        this.cards = newOrder;
        this.round++;
        
        if (this.round < 3) {
            this.updateUI();
        } else {
            await this.scatterCards();
            this.showResult();
        }
    }

    updateUI() {
        document.getElementById('roundNumber').textContent = this.round + 1;
        
        const instructions = document.getElementById('instructions');
        instructions.textContent = this.round < 2 
            ? 'Wähle den Bereich, in dem sich deine Karte befindet'
            : 'Wähle den letzten Bereich, um deine Karte aufzudecken';

        const columnsContainer = document.getElementById('columnsContainer');
        columnsContainer.innerHTML = '';
        
        const columns = this.getColumns();
        columns.forEach((column, columnIndex) => {
            const columnDiv = document.createElement('div');
            columnDiv.className = 'column';
            
            const columnLabel = document.createElement('div');
            columnLabel.className = 'column-label';
            columnLabel.textContent = `Bereich ${columnIndex + 1}`;
            columnDiv.appendChild(columnLabel);

            const cardsStack = document.createElement('div');
            cardsStack.className = 'cards-stack';
            
            column.forEach((card, cardIndex) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                cardDiv.style.top = `${cardIndex * 50}px`;
                
                const cardImg = document.createElement('img');
                cardImg.src = card.image;
                cardImg.alt = `${card.value} of ${card.suit}`;
                
                cardDiv.appendChild(cardImg);
                cardsStack.appendChild(cardDiv);
            });
            
            columnDiv.appendChild(cardsStack);
            columnsContainer.appendChild(columnDiv);
        });
    }

    showResult() {
        const modal = document.getElementById('resultModal');
        const finalCardDiv = document.getElementById('finalCard');
        const selectedCard = this.cards[10];
        
        finalCardDiv.innerHTML = `
            <img src="${selectedCard.image}" alt="${selectedCard.value} of ${selectedCard.suit}">
            <p>${this.getCardNameInGerman(selectedCard)}</p>
        `;
        
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 100);
    }

    getCardNameInGerman(card) {
        const valueMap = {
            'ACE': 'Ass',
            'KING': 'König',
            'QUEEN': 'Dame',
            'JACK': 'Bube',
            '2': '2', '3': '3', '4': '4', '5': '5',
            '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
        };

        const suitMap = {
            'HEARTS': 'Herz',
            'DIAMONDS': 'Karo',
            'CLUBS': 'Kreuz',
            'SPADES': 'Pik'
        };

        return `${valueMap[card.value]} ${suitMap[card.suit]}`;
    }
}

let game;

window.onload = () => {
    game = new CardGame();
};

function handleColumnChoice(column) {
    game.handleColumnSelection(column);
}

function restartGame() {
    const modal = document.getElementById('resultModal');
    modal.classList.remove('active');
    modal.style.display = 'none';

    const gameContainer = document.getElementById('gameContainer');
    gameContainer.classList.remove('hidden');

    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'flex';

    document.getElementById('columnsContainer').innerHTML = '';
    document.getElementById('roundNumber').textContent = '1';
    document.getElementById('instructions').textContent = 
        'Wähle eine Karte aus und merke sie dir. Wähle dann den Bereich, in dem sich deine Karte befindet.';

    game = null;

    setTimeout(() => {
        loadingScreen.style.display = 'none';
        game = new CardGame();
    }, 500);
}
