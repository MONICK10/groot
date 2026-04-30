import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Blink from './Blink';

afterEach(() => {
  jest.restoreAllMocks();
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

const makeBlink = (overrides = {}) => ({
  _id: 'blink1',
  content: 'Hello world',
  createdAt: new Date().toISOString(),
  mediaDataUrl: null,
  mediaType: null,
  userId: {
    _id: 'user2',
    name: 'Alice',
    ...overrides.userId
  },
  ...overrides
});

// Tests will use the data-testid attribute on the friend action button

test('sends friend request (POST) when clicking add button', async () => {
  const blink = makeBlink();
  localStorage.setItem('userData', JSON.stringify({ id: 'user1' }));

  const fetchMock = jest.fn((input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/api/friend-requests/check/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'none', requestId: null })
      });
    }
    if (url.endsWith('/api/friend-request') && init?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ requestId: 'req123' })
      });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });

  jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

  render(<Blink blink={blink} />);

  // ensure initial check was performed
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining(`/api/friend-requests/check/user1/${blink.userId._id}`),
    undefined
  ));

  const friendBtn = screen.getByTestId('friend-action-button');
  expect(friendBtn).toBeTruthy();

  fireEvent.click(friendBtn);

  // wait for the POST to be called (second call)
  await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2));

  const postCall = fetchMock.mock.calls.find(call => String(call[0]).includes('/api/friend-request') && call[1]?.method === 'POST');
  expect(postCall).toBeDefined();
  const postOptions = postCall[1];
  expect(postOptions).toBeDefined();
  expect(postOptions.headers).toMatchObject({ 'Content-Type': 'application/json' });
  expect(JSON.parse(postOptions.body)).toEqual({ fromUser: 'user1', toUser: blink.userId._id });
});

test('cancels pending friend request (DELETE by requestId) when clicking cancel', async () => {
  const blink = makeBlink();
  localStorage.setItem('userData', JSON.stringify({ id: 'user1' }));

  const fetchMock = jest.fn((input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/api/friend-requests/check/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'pending', requestId: 'req-xyz' })
      });
    }
    if (url.includes('/api/friend-request/req-xyz') && init?.method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Cancelled' })
      });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });

  jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

  render(<Blink blink={blink} />);

  // initial check
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining(`/api/friend-requests/check/user1/${blink.userId._id}`),
    undefined
  ));

  const friendBtn = screen.getByTestId('friend-action-button');
  expect(friendBtn).toBeTruthy();

  fireEvent.click(friendBtn);

  // wait for delete call to occur
  await waitFor(() => expect(fetchMock.mock.calls.some(call => String(call[0]).includes('/api/friend-request/req-xyz') && call[1]?.method === 'DELETE')).toBe(true));
});

test('removes friend (DELETE /api/friends) when clicking remove on friends status', async () => {
  const blink = makeBlink();
  localStorage.setItem('userData', JSON.stringify({ id: 'user1' }));

  const fetchMock = jest.fn((input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/api/friend-requests/check/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'friends', requestId: null })
      });
    }
    if (url.includes('/api/friends') && init?.method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Removed' })
      });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });

  jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

  render(<Blink blink={blink} />);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining(`/api/friend-requests/check/user1/${blink.userId._id}`),
    undefined
  ));

  const friendBtn = screen.getByTestId('friend-action-button');
  expect(friendBtn).toBeTruthy();

  fireEvent.click(friendBtn);

  // wait for delete /api/friends to be called
  await waitFor(() => expect(fetchMock.mock.calls.some(call => String(call[0]).includes('/api/friends') && call[1]?.method === 'DELETE')).toBe(true));

  const called = fetchMock.mock.calls.find(call => String(call[0]).includes('/api/friends'));
  expect(called).toBeDefined();
  const options = called[1];
  expect(options).toBeDefined();
  expect(options.method).toBe('DELETE');
  expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' });
  expect(JSON.parse(options.body)).toMatchObject({ userId: 'user1', friendId: blink.userId._id });
});

test('does not show friend button for own post', () => {
  const blink = makeBlink({ userId: { _id: 'user1', name: 'Me' } });
  localStorage.setItem('userData', JSON.stringify({ id: 'user1' }));

  const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: 'none', requestId: null })
  }));

  render(<Blink blink={blink} />);

  // For own post the component should skip the check endpoint and not show friend action
  expect(fetchSpy).not.toHaveBeenCalled();
});
