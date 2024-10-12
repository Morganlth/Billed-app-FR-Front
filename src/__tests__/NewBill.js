/**
 * @jest-environment jsdom
 */

import { screen, waitFor  } from '@testing-library/dom'
import userEvent            from '@testing-library/user-event'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore            from '../__mocks__/store.js'
import NewBillUI            from '../views/NewBillUI.js'
import NewBill              from '../containers/NewBill.js'


describe('Given I am connected as an employee', () =>
{
    describe('When I am on NewBill Page', () =>
    {
        beforeEach(async () =>
        {
            Object.defineProperty(window, 'localStorage', { value: localStorageMock })

            window.localStorage.setItem('user', JSON.stringify(
            {
                type : 'Employee',
                email: "e@e"
            }))

            document.body.innerHTML = NewBillUI()

      await waitFor(screen.getByTestId.bind(null, 'form-new-bill'))
        })

        test('Then I can add a receipt', async () =>
        {
            const
            NEW_BILL = new NewBill({ document, onNavigate: () => void 0, store: mockStore, localStorage: { clear: () => void 0 } }),
            BLOB     = new Blob(['']),
            EVENT    =
            {
                preventDefault: jest.fn(),
                target        :
                {
                    value: 'C:\\fakepath\\test.png',
                    files: [new File([BLOB], 'test.png')]
                }
            },
            input_eChange = jest.fn(NEW_BILL.handleChangeFile.bind(NEW_BILL, EVENT))

            // *change event
            screen.getByTestId('file').addEventListener('change', input_eChange)
    
            userEvent.upload(screen.getByTestId('file'), EVENT.target.files[0])

            expect(input_eChange).toBeCalled()
    
            // *preventDefault()
            expect(EVENT.preventDefault).toBeCalled()

            // *File Type
      await waitFor(screen.getByTestId.bind(null, 'errorFileType'))

            const
            ERROR_ELEMENT   = screen.getByTestId('errorFileType'),
            FILE_EXTENSIONS =
            [
                {
                    value: 'png',
                    valid: true
                },
                {
                    value: 'jpeg',
                    valid: true
                },
                {
                    value: 'gif',
                    valid: false
                }
            ]
    
            for (let i = 0, max = FILE_EXTENSIONS.length; i < max; i++)
            {
                let {value, valid} = FILE_EXTENSIONS[i]
    
                EVENT.target.files[0] = new File([BLOB], 'test.png', { type: 'image/' + value })

                NEW_BILL.handleChangeFile(EVENT)

                expect(ERROR_ELEMENT.style.display).toEqual(valid ? 'none' : 'block')
            }
        })

        test('Then I can submit the form', async () =>
        {
            const
            NEW_BILL = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: { clear: () => void 0 } }),
            EVENT    =
            {
                preventDefault: jest.fn(),
                target        : screen.getByTestId('form-new-bill')
            },
            FORM         = screen.getByTestId('form-new-bill'),
            form_eSubmit = jest.fn(NEW_BILL.handleSubmit.bind(NEW_BILL, EVENT))
            
            // *submit event
            FORM.addEventListener('submit', form_eSubmit)
            FORM.submit()

            expect(form_eSubmit).toBeCalled()
    
            // *preventDefault()
            expect(EVENT.preventDefault).toBeCalled()

            // *onNavigate
            expect(NEW_BILL.onNavigate).toHaveBeenCalledWith('#employee/bills')
        })

        test('Post a bill to a mock POST API', async () =>
        {
            let promise // *Promise returned by the "create" method of "this.store.bills().create" from the "handleChangeFile" method of the "NewBill" class instance.
        
            const create = jest.fn(() =>
            {
                promise = mockStore.bills().create()

                return promise
            })

            jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => { return {create} })

            const NEW_BILL = new NewBill({ document, onNavigate: () => void 0, store: mockStore, localStorage: { clear: () => void 0 } })

            NEW_BILL.handleChangeFile(
            {
                preventDefault: () => void 0,
                target        :
                {
                    value: 'C:\\fakepath\\test.png',
                    files: [new File([new Blob([''])], 'test.png', { type: 'image/png' })]
                }
            })

            let {fileUrl, key} = (await promise) ?? {}
    
            expect(create          ).toBeCalled()
            expect(NEW_BILL.fileUrl).toBe(fileUrl)
            expect(NEW_BILL.billId ).toBe(key)
        })

        // *No error behaviour (except console.error).
    })
})