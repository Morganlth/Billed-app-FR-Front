import { ROUTES_PATH } from '../constants/routes.js'
import Logout          from './Logout.js'

export default class NewBill
{
    constructor({ document, onNavigate, store, localStorage })
    {
        this.document   = document
        this.onNavigate = onNavigate
        this.store      = store
        this.fileUrl    = this.fileName = this.billId = null

        this.document.querySelector(`form[data-testid="form-new-bill"]`).addEventListener("submit", this.handleSubmit)
    
        this.document.querySelector(`input[data-testid="file"]`).addEventListener("change", this.handleChangeFile)

        new Logout({ document, localStorage, onNavigate })
    }

    handleChangeFile = e =>
    {
        e.preventDefault()
    
        const
        INPUT_FILE = e.target,
        FILE       = INPUT_FILE.files[0],
        TYPE       = FILE.type

        if (TYPE !== 'image/jpeg' && TYPE !== 'image/png') // !Adding a simple type control + error message (view NewBillUI.js).
        {
            INPUT_FILE.value = ''
    
            this.document.querySelector('[data-testid="errorFileType"]').style.display = 'block'

            return
        }

        this.document.querySelector('[data-testid="errorFileType"]').style.display = 'none'

        const FORM_DATA = new FormData()
    
        FORM_DATA.append('file', FILE)
        FORM_DATA.append('email', JSON.parse(localStorage.getItem('user')).email)

        this.store.bills().create( // *It's strange to create the bill when adding the file... I didn't modify it to keep the original structure.
        {
            data   : FORM_DATA,
            headers: { noContentType: true }
        })
        .then(({fileUrl, key}) =>
        {
            this.billId   = key
            this.fileUrl  = fileUrl
            this.fileName = INPUT_FILE.value.split(/\\/g).slice(-1)[0]
        })
        .catch(console.error)
    }

    handleSubmit = e =>
    {
        e.preventDefault()

        this.updateBill(
        {
            email     : JSON.parse(localStorage.getItem('user')).email,
            type      : e.target.querySelector('select[data-testid="expense-type"]').value,
            name      : e.target.querySelector('input[data-testid="expense-name"]').value,
            amount    : parseInt(e.target.querySelector('input[data-testid="amount"]').value),
            date      : e.target.querySelector('input[data-testid="datepicker"]').value,
            vat       : e.target.querySelector('input[data-testid="vat"]').value,
            pct       : parseInt(e.target.querySelector('input[data-testid="pct"]').value) || 20,
            commentary: e.target.querySelector('textarea[data-testid="commentary"]').value,
            fileUrl   : this.fileUrl,
            fileName  : this.fileName,
            status    : 'pending'
        })
    
        this.onNavigate(ROUTES_PATH['Bills'])
    }

    // not need to cover this function by tests
    updateBill = (bill) =>
    {
        this.store?.bills().update(
        {
            data    : JSON.stringify(bill),
            selector: this.billId
        })
        .then(() => this.onNavigate(ROUTES_PATH['Bills']))
        .catch(console.error)
    }
}