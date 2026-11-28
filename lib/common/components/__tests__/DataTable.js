import {fireEvent, render, screen, within} from '@testing-library/react'
import React from 'react'
import {vi} from 'vitest'

import DataTable from '../DataTable'
import fileDownload from '../../util/file-download'

vi.mock('../../util/file-download', () => ({default: vi.fn()}))

describe('DataTable', () => {
  it('sorts and filters stops and exports all matching rows in the current order', () => {
    const columns = [
      {children: 'ID', dataField: 'id', sortable: true},
      {children: 'Name', dataField: 'name', sortable: true}
    ]
    const data = Array.from({length: 12}, (_, index) => ({
      id: index + 1,
      name: index === 0 ? 'Centro "Norte", Cartagena' : 'Centro'
    })).concat({id: 13, name: 'Portal'})
    render(<DataTable columns={columns} data={data} exportCSV label='Stops' rowKey='id' search />)

    fireEvent.click(screen.getByRole('button', {name: 'Next'}))
    expect(screen.getByText('11–13 of 13')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox', {name: 'Search Stops'}), {target: {value: 'CENTRO'}})
    expect(screen.getByText('1–10 of 12')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', {name: 'ID'}))
    fireEvent.click(screen.getByRole('button', {name: 'ID'}))
    expect(screen.getByRole('columnheader', {name: 'ID'}).getAttribute('aria-sort')).toBe('descending')
    expect(within(screen.getAllByRole('row')[1]).getByText('12')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', {name: 'Export to CSV'}))
    const [csv, name, type] = vi.mocked(fileDownload).mock.lastCall
    expect(name).toBe('spreadsheet.csv')
    expect(type).toBe('text/csv;charset=utf-8')
    expect(csv.split('\r\n')).toHaveLength(14)
    expect(csv).toContain('"id","name"\r\n"12","Centro"')
    expect(csv).toContain('"1","Centro ""Norte"", Cartagena"')
    expect(csv).not.toContain('Portal')
  })

  it('keeps grouped timetable headers and passes the absolute row index to cell formatting', () => {
    const dataFormat = vi.fn((value, row, extra, index) => `${value} at ${index}`)
    const columns = [
      {children: 'Trip', dataField: 'id', hidden: true},
      {children: 'Central', colSpan: '2', csvHeader: 'Central', row: '0'},
      {children: 'Arrive', csvHeader: 'Arrive', dataField: 'arrival', dataFormat, row: '1'},
      {children: 'Dwell', csvHeader: 'Dwell', dataField: 'dwell', row: '1'}
    ]
    const data = Array.from({length: 51}, (_, index) => ({arrival: index, dwell: '--', id: `trip-${index}`}))
    render(<DataTable columns={columns} data={data} exportCSV label='Timetables' pageSize={50} rowKey='id' />)

    expect(screen.getByRole('columnheader', {name: 'Central'}).getAttribute('colspan')).toBe('2')
    expect(screen.queryByRole('columnheader', {name: 'Trip'})).toBeNull()
    fireEvent.change(screen.getByRole('combobox', {name: 'Timetables page'}), {target: {value: '1'}})
    expect(screen.getByText('50 at 50')).toBeTruthy()
    expect(dataFormat).toHaveBeenLastCalledWith(50, data[50], undefined, 50)

    fireEvent.click(screen.getByRole('button', {name: 'Export to CSV'}))
    expect(vi.mocked(fileDownload).mock.lastCall[0]).toContain('"Central","Central"\r\n"Arrive","Dwell"\r\n"0","--"')
  })
})
