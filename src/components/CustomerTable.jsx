import CustomerDocuments from './CustomerDocuments'

function CustomerTable({ customers, onEdit, onDelete }) {
  if (customers.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          No customers found.
        </p>

        <p className="text-sm text-gray-400 mt-1">
          Add your first customer to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">

        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Sr. No.
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Client / Company Name
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Contact Person
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Contact No.
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Office No.
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Post
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Mail ID
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Category / Details
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Documents
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Remark
            </th>

            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
              Contact Date
            </th>

            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
              Actions
            </th>

          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >

              <td className="px-4 py-3 text-sm text-gray-700">
                {customer.sr_no}
              </td>

              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {customer.client_name || '-'}
              </td>

              <td className="px-4 py-3 text-sm text-gray-700">
                {customer.contact_person || '-'}
              </td>

              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                {customer.contact_number || '-'}
              </td>

              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                {customer.office_number || '-'}
              </td>

              <td className="px-4 py-3 text-sm text-gray-700">
                {customer.designation || '-'}
              </td>

              <td className="px-4 py-3 text-sm text-gray-700">
                {customer.email || '-'}
              </td>

              <td className="px-4 py-3 text-sm text-gray-700 max-w-sm whitespace-pre-wrap">
                <div className="max-w-sm min-w-48">{customer.category || '-'}</div>
              </td>

              <td className="px-4 py-3 align-top">
                <CustomerDocuments customerId={customer.id} />
              </td>

              <td className="px-4 py-3 text-sm text-gray-700 max-w-xs whitespace-pre-wrap">
                {customer.remark || '-'}
              </td>

              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                {customer.contact_date || '-'}
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">

                  <button
                    onClick={() => onEdit(customer)}
                    className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(customer)}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Delete
                  </button>

                </div>
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  )
}

export default CustomerTable