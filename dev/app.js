import createStore from './store/mpstore.esm'

const { store, createComponent, createPage } = createStore()
Page = createPage
Component = createComponent

//app.js
App({})