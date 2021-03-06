import React, { Component } from 'react'
// import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
import MonopolyContract from '../build/contracts/Monopoly.json'
import getWeb3 from './utils/getWeb3'
import Board from './components/board'
import CreateGame from './components/createGame'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

//events TO DO
  //player join game (update state and UI)
  //game start


class App extends Component {
  constructor(props) {
    super(props)

    // this.joinGame = this.joinGame.bind(this)

    this.state = {
      storageValue: 0,
      web3: null,
      monopolyContract: null,
      account: null,
      currentGame: false,
      currentGameId: false,
      currentGameOwner: false,
      playerGames: [],
      randomNumber: 0
    }
  }

  selectGame(gameId, game={}){
    this.setState({currentGame: gameId})
    localStorage.setItem('currentGameId', gameId)
  }

  createGame(numPlayers, name){
    let randomNumber = Math.floor(Math.random()*100) % numPlayers
    this.setState({randomNumber: randomNumber})
    this.state.monopolyContract.createGame(numPlayers, randomNumber, name, {from: this.state.account})
    .then( result => {
      var gameId = result.logs[0].args.gameId
      this.selectGame(gameId)
    })
    .catch(err => {
      console.log(err)
    })
  }

  buildGame(contractResponse){
    //based off Game struct defined in contract
    return {
      gameState: contractResponse[0].toString(),
      name: contractResponse[1].toString(),
      currentPlayer: contractResponse[2].toString(),
      houseIndex: contractResponse[3].toString(),
      hotelIndex: contractResponse[4].toString(),
      owner: contractResponse[5].toString(),
      gameId: contractResponse[6].toString(),
      players: contractResponse[7],
    }
  }

  findGame(gameId){
    //this needs to use gameId somehow
    this.state.monopolyContract.getGame(gameId, {from: this.state.account})
    .then(result => {
      var game = this.buildGame(result)
      console.log(result, game)
      this.setState({currentGame: game, currentGameId: game.gameId, currentGameOwner: game.owner})
    })
  }

  findGames(){
    this.state.monopolyContract.getPlayerGames(this.state.account, {from: this.state.account})
    .then(result => {
      var games = result.map( gameId => {
        console.log(gameId)
        return this.state.monopolyContract.games.call(gameId) 
      })
      return Promise.all(games)
    })
    .then(games => {
      var formattedGames = games.map(game => this.buildGame(game))
      this.setState({playerGames: formattedGames})
      console.log(formattedGames)
    })
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.


  }

  componentDidMount(){
    //listen for events here
    // this.state.monopolyContract.
    if (this.state.account) {

    }

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateContract() {
    const contract = require('truffle-contract')

    const monopoly = contract(MonopolyContract)
    monopoly.setProvider(this.state.web3.currentProvider)

    var monopolyInstance

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      monopoly.deployed().then(instance => {
        monopolyInstance = instance
        this.monopolyInstance = instance
        return this.setState({monopolyContract: monopolyInstance, account: accounts[0]}, this.instantiateContractListeners)
      })
    })

    setInterval(() => {
      if (this.state.web3.eth.accounts[0] !== this.state.account) {
        console.log('account change')
        this.setState({account: this.state.web3.eth.accounts[0]});
      }
    }, 100);
  }

  instantiateContractListeners(){
    //TODO: what to do with events. "Recent Events List?"

    let gameJoined = this.state.monopolyContract.PlayerJoined();
    let gameStarted = this.state.monopolyContract.PlayerJoined();

    gameJoined.watch( (error, result) => {
      if (!error) {
        console.log(result)
        //result.args.player, result.args.gameId
      }
    })
  }

  render() {

    let gameState = this.state.currentGame ? <Board {...this.state} /> : <CreateGame playerGames={this.state.playerGames} findGames={this.findGames.bind(this)} findGame={this.findGame.bind(this)} createGame={this.createGame.bind(this)} creating={this.state.creatingGame} />;
    let properties;

    if (this.state.currentGame) {
      properties = 'These are your properties'
    }
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Monopoly</a>
        </nav>

        <main className="container">

        </main>

        {gameState}

        
      </div>
    );
  }
}

export default App
