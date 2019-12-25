import { isError } from '../utils'
import createStore from '../../src/index'
import TimeTravel from '../../src/time-travel'

function createComponent ( travelLimit, needAddAction = true) {
  const id = simulate.load(Component({
    template: '<div>{{ global.a }}{{ global.b }}</div>',
    storeConfig: {
      travelLimit,
      defineReducer (store) {
        if (needAddAction) {
          store.add('testAction', {
            partialState: { a: 1, b: 2 },
            setter: (state, payload) => payload,
          })
        }
      },
      useState: () => ({
        a: state => state.a,
        b: state => state.b,
      }),
    },
    attached () {
      expect(this.timeTravel instanceof TimeTravel).toBeTruthy()
    },
  }))
  const cm = simulate.render(id)
  cm.attach(document.createElement('parent-wrapper'))
  return cm
}

describe('Time travel', () => {
  it('go', done => {
    const store = createStore()
    const cm = createComponent(3)
    expect(cm.dom.textContent).toBe('12')
    expect(cm.instance.timeTravel instanceof TimeTravel).toBeTruthy()
    const change = (a, b, callback, go = 0) => {
      store.dispatch('testAction', { a, b }, () => {
        expect(cm.dom.textContent).toBe(`${a}${b}`)
        expect(cm.instance.timeTravel.length).toBe(cm.instance.timeTravel.history.length)
        expect(cm.instance.timeTravel.history.length + go).toBe(cm.instance.timeTravel.current)
        callback()
      })
    }
    change(2, 2, () => {
      change(3, 3, () => {
        change(4, 4, () => {
          cm.instance.timeTravel.go(-1)
          change(3, 3, () => {
            cm.instance.timeTravel.go(-1)
            change(2, 2, () => {
              cm.instance.timeTravel.go(-1)
              change(1, 2, () => {
                cm.instance.timeTravel.go(-1)
                change(1, 2, () => {
                  cm.instance.timeTravel.go(1)
                  change(2, 2, () => {
                    cm.instance.timeTravel.go(2)
                    change(4, 4, () => done())
                  }, -2)
                }, -3)
              }, -3)
            }, -2)
          }, -1)
        })
      })
    })
  })

  it('back', done => {
    const store = createStore()
    const cm = createComponent(3)
    const change = (a, b, callback, go = 0) => {
      store.dispatch('testAction', { a, b }, () => {
        expect(cm.dom.textContent).toBe(`${a}${b}`)
        expect(cm.instance.timeTravel.length).toBe(cm.instance.timeTravel.history.length)
        expect(cm.instance.timeTravel.history.length + go).toBe(cm.instance.timeTravel.current)
        callback()
      })
    }
    change(2, 2, () => {
      change(3, 3, () => {
        change(4, 4, () => {
          cm.instance.timeTravel.back()
          change(3, 3, () => {
            cm.instance.timeTravel.back()
            change(2, 2, () => {
              cm.instance.timeTravel.back()
              change(1, 2, () => {
                cm.instance.timeTravel.back()
                change(1, 2, () => done(), -3)
              }, -3)
            }, -2)
          }, -1)
        })
      })
    })
  })

  it('forward', done => {
    const store = createStore()
    const cm = createComponent(3)
    const change = (a, b, callback, go = 0) => {
      store.dispatch('testAction', { a, b }, () => {
        expect(cm.dom.textContent).toBe(`${a}${b}`)
        expect(cm.instance.timeTravel.length).toBe(cm.instance.timeTravel.history.length)
        expect(cm.instance.timeTravel.history.length + go).toBe(cm.instance.timeTravel.current)
        callback()
      })
    }
    change(2, 2, () => {
      change(3, 3, () => {
        change(4, 4, () => {
          cm.instance.timeTravel.go(-3)
          change(1, 2, () => {
            cm.instance.timeTravel.go(-1)
            change(1, 2, () => {
              cm.instance.timeTravel.forward()
              change(2, 2, () => {
                cm.instance.timeTravel.forward()
                change(3, 3, () => {
                  cm.instance.timeTravel.forward()
                  change(4, 4, () => {
                    cm.instance.timeTravel.forward()
                    change(4, 4, () => done(), 0)
                  }, 0)
                }, -1)
              }, -2)
            }, -3)
          }, -3)
        })
      })
    })
  })

  it('toStart', done => {
    const store = createStore()
    const cm = createComponent(3)
    const change = (a, b, callback, go = 0) => {
      store.dispatch('testAction', { a, b }, () => {
        expect(cm.dom.textContent).toBe(`${a}${b}`)
        expect(cm.instance.timeTravel.length).toBe(cm.instance.timeTravel.history.length)
        expect(cm.instance.timeTravel.history.length + go).toBe(cm.instance.timeTravel.current)
        callback()
      })
    }
    change(2, 2, () => {
      change(3, 3, () => {
        change(4, 4, () => {
          cm.instance.timeTravel.toStart()
          change(1, 2, () => done(), -3)
        })
      })
    })
  })

  it('toEnd', done => {
    const store = createStore()
    const cm = createComponent(3)
    const change = (a, b, callback, go = 0) => {
      store.dispatch('testAction', { a, b }, () => {
        expect(cm.dom.textContent).toBe(`${a}${b}`)
        expect(cm.instance.timeTravel.length).toBe(cm.instance.timeTravel.history.length)
        expect(cm.instance.timeTravel.history.length + go).toBe(cm.instance.timeTravel.current)
        callback()
      })
    }
    change(2, 2, () => {
      change(3, 3, () => {
        change(4, 4, () => {
          cm.instance.timeTravel.go(-3)
          change(1, 2, () => {
            cm.instance.timeTravel.go(-1)
            change(1, 2, () => {
              cm.instance.timeTravel.toEnd()
              change(4, 4, () => done())
            }, -3)
          }, -3)
        })
      })
    })
  })

  it('`travelLimit` must be a number', () => {
    expect(isError(() => createComponent(''))).toBeTruthy()
  })
  
  it('`travelLimit` defaults to 0', () => {
    const store = createStore()
    const cm = createComponent()
    expect(cm.instance.timeTravel.limit).toBe(0)
  })

  it('if exceed `travelLimit` range, no work', done => {
    const store = createStore()
    const cm = createComponent(3)
    const change = (a, b, callback, go = 0) => {
      store.dispatch('testAction', { a, b }, () => {
        expect(cm.dom.textContent).toBe(`${a}${b}`)
        expect(cm.instance.timeTravel.length).toBe(cm.instance.timeTravel.history.length)
        expect(cm.instance.timeTravel.history.length + go).toBe(cm.instance.timeTravel.current)
        callback()
      })
    }
    change(2, 2, () => {
      change(3, 3, () => {
        change(4, 4, () => {
          cm.instance.timeTravel.go(-4)
          change(4, 4, () => {
            done()
          })
        })
      })
    })
  })

  it('if exceed record stack range, no work', done => {
    const store = createStore()
    const cm = createComponent(3)
    const change = (a, b, callback, go = 0) => {
      store.dispatch('testAction', { a, b }, () => {
        expect(cm.dom.textContent).toBe(`${a}${b}`)
        expect(cm.instance.timeTravel.length).toBe(cm.instance.timeTravel.history.length)
        expect(cm.instance.timeTravel.history.length + go).toBe(cm.instance.timeTravel.current)
        callback()
      })
    }
    change(2, 2, () => {
      change(3, 3, () => {
        expect(cm.instance.timeTravel.history.length).toBe(2)
        cm.instance.timeTravel.go(-3)
        change(3, 3, () => {
          done()
        })
      })
    })
  })

  it('record patchs, only when global state changed', done => {
    const store = createStore()
    const id = simulate.load(Component({
      data: {
        name: 'tao',
      },
      template: '<div>{{ global.a }}{{ global.b }}</div>',
      storeConfig: {
        travelLimit: 3,
        defineReducer (store) {
          store.add('testAction', {
            partialState: {
              a: 1,
              b: 2,
            },
            setter: (state, payload) => payload,
          })
        },
        useState: () => ({
          a: state => state.a,
          b: state => state.b,
        }),
      },
      attached () {
        expect(this.timeTravel instanceof TimeTravel).toBeTruthy()
      },
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    const timeTravel = cm.instance.timeTravel
    expect(timeTravel.length).toBe(0)
    cm.setData({ name: 'imtaotao' })
    expect(timeTravel.length).toBe(0)
    store.dispatch('testAction', { a: 2, b: 2 }, () => {
      expect(timeTravel.length).toBe(1)
      cm.setData({ name: 'taotao' })
      expect(timeTravel.length).toBe(1)
      store.dispatch('testAction', { a: 3, b: 3 }, () => {
        expect(timeTravel.length).toBe(2)
        done()
      })
    })
  })

  it('if no use global state, call timetravel api will throw error', () => {
    const store = createStore()
    const id = simulate.load(Component({
      template: '<div></div>',
    }))
    const cm = simulate.render(id)
    cm.attach(document.createElement('parent-wrapper'))
    const go = () => cm.instance.timeTravel.go()
    const back = () => cm.instance.timeTravel.back()
    const toEnd = () => cm.instance.timeTravel.toEnd()
    const toStart = () => cm.instance.timeTravel.toStart()
    const forward = () => cm.instance.timeTravel.forward()
    expect(isError(go)).toBeTruthy()
    expect(isError(back)).toBeTruthy()
    expect(isError(toEnd)).toBeTruthy()
    expect(isError(toStart)).toBeTruthy()
    expect(isError(forward)).toBeTruthy()
  })

  it('scoped in current component', done => {
    const store = createStore()
    const one = createComponent(3)
    const two = createComponent(3, false)
    // push once
    store.dispatch('testAction', { a: 2, b: 2 }, () => {
      store.dispatch('testAction', { a: 3, b: 3 }, () => {
        store.dispatch('testAction', { a: 4, b: 4 }, () => {
          expect(one.dom.textContent).toBe('44')
          expect(two.dom.textContent).toBe('44')
          expect(one.instance.timeTravel.length).toBe(3)
          expect(two.instance.timeTravel.length).toBe(3)
          one.instance.timeTravel.go(-1)
          expect(one.dom.textContent).toBe('33')
          expect(two.dom.textContent).toBe('44')
          two.instance.timeTravel.go(-1)
          expect(one.dom.textContent).toBe('33')
          expect(two.dom.textContent).toBe('33')
          one.instance.timeTravel.toStart()
          two.instance.timeTravel.toEnd()
          expect(one.dom.textContent).toBe('12')
          expect(two.dom.textContent).toBe('44')
          store.dispatch('testAction', { a: 5, b: 5 }, () => {
            expect(one.dom.textContent).toBe('55')
            expect(two.dom.textContent).toBe('55')
            done()
          })
        })
      })
    })
  })

  it('if global state changed, `current` will direction to end point', done => {
    const store = createStore()
    const cm = createComponent(4)
    const timeTravel = cm.instance.timeTravel
    store.dispatch('testAction', { a: 2, b: 2 }, () => {
      store.dispatch('testAction', { a: 3, b: 3 }, () => {
        store.dispatch('testAction', { a: 4, b: 4 }, () => {
          expect(cm.dom.textContent).toBe('44')
          timeTravel.back()
          timeTravel.back()
          timeTravel.back()
          expect(cm.dom.textContent).toBe('12')
          expect(timeTravel.length).toBe(3)
          expect(timeTravel.current).toBe(0)
          store.dispatch('testAction', { a: 5, b: 5 }, () => {
            expect(timeTravel.length).toBe(4)
            expect(timeTravel.current).toBe(4)
            expect(cm.dom.textContent).toBe('55')
            done()
          })
        })
      })
    })
  })

  it('history push', done => {
    const store = createStore()
    const cm = createComponent(3)
    const timeTravel = cm.instance.timeTravel
    store.dispatch('testAction', { a: 2, b: 2 }, () => {
      store.dispatch('testAction', { a: 3, b: 3 }, () => {
        store.dispatch('testAction', { a: 4, b: 4 }, () => {
          expect(cm.dom.textContent).toBe('44')
          timeTravel.toStart()
          expect(cm.dom.textContent).toBe('12')
          const secPatchs = timeTravel.history[1]
          store.dispatch('testAction', { a: 5, b: 5 }, () => {
            expect(cm.dom.textContent).toBe('55')
            expect(timeTravel.length).toBe(3)
            expect(timeTravel.current).toBe(3)
            timeTravel.toStart()
            expect(cm.dom.textContent).toBe('22')
            expect(timeTravel.length).toBe(3)
            expect(timeTravel.current).toBe(0)
            expect(timeTravel.history[0]).toEqual(secPatchs)
            done()
          })
        })
      })
    })
  })
})