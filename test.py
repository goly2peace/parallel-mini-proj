#
# Unit Tests - Chat Management Server
# created by Natawut Nupairoj
# Department of Computer Engineering, Chulalongkorn University
# for 2110315 Parallel and Distributed Systems

import requests
import pytest


# configuration for the location of test servers
servers = [
    'http://localhost:4000',
    'http://localhost:5000'
]

class ChatMgmtClient:
    def __init__(self, base_url):
        if base_url[-1] != '/':
            base_url = base_url + '/'
        self.allrooms_url = base_url + 'allrooms'
        self.room_url = base_url + 'room'

    def get_room_list(self):
        r = requests.get(self.allrooms_url)
        return r.json(), r.status_code

    def add_newroom(self, room_id):
        r = requests.post(self.allrooms_url, data={'id': room_id})
        return r.json(), r.status_code

    def add_room_ifnotexist(self, room_id):
        r = requests.put(self.allrooms_url, data={'id': room_id})
        return r.json(), r.status_code

    def remove_room(self, room_id):
        r = requests.delete(self.allrooms_url, data={'id': room_id})
        return r.json(), r.status_code

    def get_room_members(self, room_id):
        url = self.room_url + '/' + room_id
        r = requests.get(url)
        return r.json(), r.status_code

    def join_room(self, room_id, user_id):
        url = self.room_url + '/' + room_id
        r = requests.post(url, data={'user': user_id})
        return r.json(), r.status_code

    def leave_room(self, room_id, user_id):
        url = self.room_url + '/' + room_id
        r = requests.delete(url, data={'user': user_id})
        return r.json(), r.status_code


@pytest.fixture(scope="module")
def clients():
    return [ChatMgmtClient(s) for s in servers]


@pytest.fixture(scope="module")
def room_name():
    return '315-test-room'


def test_get_room_list(clients):
    r, status_code = clients[0].get_room_list()
    assert status_code == 200
    assert r is not None


def test_remove_room(clients, room_name):
    r, status_code = clients[0].remove_room(room_name)
    assert status_code == 200 or status_code == 404
    r, status_code = clients[0].remove_room(room_name)
    assert status_code == 404


def test_add_room_ifnotexist(clients, room_name):
    clients[0].remove_room(room_name)
    r, status_code = clients[0].add_room_ifnotexist(room_name)
    assert status_code == 201
    r, status_code = clients[0].get_room_list()
    assert status_code == 200
    assert room_name in r
    r, status_code = clients[0].add_room_ifnotexist(room_name)
    assert status_code == 200


def test_add_newroom(clients, room_name):
    r, status_code = clients[0].remove_room(room_name)
    assert status_code == 200 or status_code == 404
    r, status_code = clients[0].add_newroom(room_name)
    assert status_code == 201
    r, status_code = clients[0].get_room_list()
    assert status_code == 200
    assert room_name in r
    r, status_code = clients[0].add_newroom(room_name)
    assert status_code == 404


def test_get_members(clients, room_name):
    r, status_code = clients[0].remove_room(room_name)
    assert status_code == 200 or status_code == 404
    r, status_code = clients[0].get_room_members(room_name)
    assert status_code == 404
    r, status_code = clients[0].add_newroom(room_name)
    assert status_code == 201
    r, status_code = clients[0].get_room_members(room_name)
    assert status_code == 200
    assert len(r) == 0


def test_join_room(clients, room_name):
    clients[0].remove_room(room_name)
    clients[0].add_newroom(room_name)
    n = 5
    for i in range(n):
        username = 'user{}'.format(i)
        r, status_code = clients[0].join_room(room_name, username)
        assert status_code == 201 or status_code == 200

    members, status_code = clients[0].get_room_members(room_name)
    assert status_code == 200
    assert len(members) == n

    for i in range(n):
        username = 'user{}'.format(i)
        assert username in members


def test_leave_room(clients, room_name):
    clients[0].remove_room(room_name)
    clients[0].add_newroom(room_name)
    username = 'user999'
    clients[0].join_room(room_name, username)
    r, status_code = clients[0].leave_room(room_name, username)
    assert status_code == 200
    members, status_code = clients[0].get_room_members(room_name)
    assert status_code == 200
    assert len(members) == 0
    r, status_code = clients[0].leave_room(room_name, username)
    assert status_code == 404


def test_join_room_multi_servers(clients, room_name):
    assert len(clients) > 1
    clients[0].remove_room(room_name)
    clients[1].add_room_ifnotexist(room_name)
    r, status_code = clients[0].get_room_list()
    assert status_code == 200
    assert room_name in r

    n = 5
    for i in range(n):
        username = 'user{}'.format(i)
        r, status_code = clients[i%2].join_room(room_name, username)
        assert status_code == 201

    members, status_code = clients[1].get_room_members(room_name)
    assert status_code == 200
    assert len(members) == n

    for i in range(n):
        username = 'user{}'.format(i)
        assert username in members