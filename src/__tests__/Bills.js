/**
 * @jest-environment jsdom
 */

import { screen, waitFor  } from '@testing-library/dom'
import BillsUI              from '../views/BillsUI.js'
import { bills            } from '../fixtures/bills.js'
import { ROUTES_PATH      } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore            from '../__mocks__/store.js' // !import
import router               from '../app/Router.js'
import userEvent            from '@testing-library/user-event' // !import
import Bills                from '../containers/Bills.js' // !import

jest.mock('../app/store', () => mockStore) // !mock

describe('Given I am connected as an employee', () =>
{
    describe('When I am on Bills Page', () =>
    {
        test('Then bill icon in vertical layout should be highlighted', async () =>
        {
            Object.defineProperty(window, 'localStorage', { value: localStorageMock })

            localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

            document.body.innerHTML = '<div id="root"></div>'

            router()

            window.onNavigate(ROUTES_PATH.Bills)
    
      await waitFor(() => screen.getByTestId('icon-window'))

            //to-do write expect expression
            // !Check for the presence of the "active-icon" class
            expect(screen.getByTestId('icon-window').className).toContain('active-icon')
        })

        test('Then bills should be ordered from earliest to latest', () =>
        {
            document.body.innerHTML = BillsUI({ data: bills })
    
            const
            DATES        = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML),
            ANTI_CHRONO  = (a, b) => ((a < b) ? 1 : -1),
            DATES_SORTED = [...DATES].sort(ANTI_CHRONO)
    
            expect(DATES).toEqual(DATES_SORTED)
        })
  
        // !Added
        test('Then I can see the details of the bills', () =>
        {
            document.body.innerHTML = BillsUI({ data: bills })
        
            const
            BILLS          = new Bills({ document, onNavigate, localStorage }),
            ICON_EYE_ARRAY = screen.getAllByTestId('icon-eye')

            for (let i = 0, max = ICON_EYE_ARRAY.length; i < max; i++)
            {
                const
                ICON_EYE       = ICON_EYE_ARRAY[i],
                iconEye_eClick = jest.fn(() => BILLS.handleClickIconEye(ICON_EYE))
            
                ICON_EYE.addEventListener('click', iconEye_eClick)
        
                userEvent.click(ICON_EYE)

                expect(iconEye_eClick).toHaveBeenCalled()
            }
        })

        test('Then I can add a new bill', () =>
        {
            document.body.innerHTML = '<div id="root"></div>'

            router()

            document.getElementById('root').innerHTML = BillsUI({ data: bills })
        
            const
            BILLS         = new Bills({ document, onNavigate, localStorage }),
            BUTTON        = screen.getByTestId('btn-new-bill'),
            button_eClick = jest.fn(BILLS.handleClickNewBill.bind(BILLS))
        
            BUTTON.addEventListener('click', button_eClick)
    
            userEvent.click(BUTTON)
        
            expect(button_eClick).toHaveBeenCalled()
        })
    })
})

describe('Given I am a user connected as employee', () =>
{
    test('fetches bills from mock API GET', async () =>
    {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })

        localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
    
        document.body.innerHTML = '<div id="root"></div>'

        router()

        window.onNavigate(ROUTES_PATH.Bills)

  await waitFor(screen.getByText.bind(null, 'Loading...'))
  await waitFor(screen.getByTestId.bind(null, 'tbody'))
        
        expect(screen.getByText('encore')).toBeTruthy()
        expect(screen.getByText('test1')).toBeTruthy()
        expect(screen.getByText('test2')).toBeTruthy()
        expect(screen.getByText('test3')).toBeTruthy()
    })

    describe('When an error occurs on API', () =>
    {
        beforeEach(() =>
        {
            jest.spyOn(mockStore, 'bills')
            
            Object.defineProperty(window, 'localStorage', { value: localStorageMock })

            localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        
            document.body.innerHTML = '<div id="root"></div>'

            router()
        })
    
        test('fetches bills from an API and fails with 404 message error', async () =>
        {
            mockStore.bills.mockImplementationOnce(() => { return { list: async () => { throw new Error('Erreur 404') } }})
        
            window.onNavigate(ROUTES_PATH.Bills)
    
      await waitFor(screen.getByTestId.bind(null, 'error-message'))
    
            expect(screen.getByText(/Erreur 404/)).toBeTruthy()
        })

        test('fetches messages from an API and fails with 500 message error', async () =>
        {
            mockStore.bills.mockImplementationOnce(() => { return { list: async () => { throw new Error('Erreur 500') } }})

            window.onNavigate(ROUTES_PATH.Bills)
    
      await waitFor(screen.getByTestId.bind(null, 'error-message'))
    
            expect(screen.getByText(/Erreur 500/)).toBeTruthy()
        })
    })
})
