// Bid Zone Application JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Bid Zone application loaded');
    
    // Sample auction data
    const sampleAuctions = [
        {
            id: 1,
            title: 'Vintage Watch',
            description: 'A beautiful vintage timepiece from the 1960s',
            currentBid: 250,
            endTime: new Date(Date.now() + 86400000) // 24 hours from now
        },
        {
            id: 2,
            title: 'Rare Collectible Coin',
            description: 'Limited edition gold coin from 1899',
            currentBid: 500,
            endTime: new Date(Date.now() + 172800000) // 48 hours from now
        },
        {
            id: 3,
            title: 'Antique Furniture Set',
            description: 'Victorian era mahogany dining set',
            currentBid: 1200,
            endTime: new Date(Date.now() + 259200000) // 72 hours from now
        }
    ];

    // Initialize the auction list
    function initAuctions() {
        const auctionList = document.getElementById('auction-list');
        
        sampleAuctions.forEach(auction => {
            const auctionElement = createAuctionElement(auction);
            auctionList.appendChild(auctionElement);
        });
    }

    // Create an auction element
    function createAuctionElement(auction) {
        const div = document.createElement('div');
        div.className = 'auction-item';
        div.innerHTML = `
            <h3>${auction.title}</h3>
            <p>${auction.description}</p>
            <p class="price">$${auction.currentBid}</p>
            <p class="time-remaining">Time remaining: ${getTimeRemaining(auction.endTime)}</p>
            <button onclick="placeBid(${auction.id})">Place Bid</button>
        `;
        return div;
    }

    // Calculate time remaining
    function getTimeRemaining(endTime) {
        const total = endTime - new Date();
        const hours = Math.floor(total / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    }

    // Start bidding button handler
    const startBiddingBtn = document.getElementById('startBidding');
    if (startBiddingBtn) {
        startBiddingBtn.addEventListener('click', function() {
            document.getElementById('featured-auctions').scrollIntoView({ 
                behavior: 'smooth' 
            });
        });
    }

    // Initialize auctions on page load
    initAuctions();
});

// Global function for placing bids
function placeBid(auctionId) {
    alert(`Bidding functionality is currently unavailable. Please check back later.`);
    console.log(`Bid placed for auction ${auctionId}`);
}
