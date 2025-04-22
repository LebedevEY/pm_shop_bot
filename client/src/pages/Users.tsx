import { useState, useEffect } from 'react';
import {
  Table, Button, Space, Typography, Tag, message, Modal, Tooltip
} from 'antd';
import { LockOutlined, UnlockOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { UserService } from '../services/user.service';
import { User } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { confirm } = Modal;

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await UserService.getAll();
      setUsers(data);
    } catch (error) {
      message.error('Ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showBlockConfirm = (user: User) => {
    confirm({
      title: `Заблокировать пользователя ${user.username}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Пользователь не сможет войти в систему или совершать заказы.',
      okText: 'Заблокировать',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await UserService.blockUser(user.id);
          message.success(`Пользователь ${user.username} заблокирован`);
          fetchUsers();
        } catch (error) {
          message.error('Ошибка при блокировке пользователя');
        }
      },
    });
  };

  const showUnblockConfirm = (user: User) => {
    confirm({
      title: `Разблокировать пользователя ${user.username}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Пользователь сможет снова войти в систему и совершать заказы.',
      okText: 'Разблокировать',
      okType: 'primary',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await UserService.unblockUser(user.id);
          message.success(`Пользователь ${user.username} разблокирован`);
          fetchUsers();
        } catch (error) {
          message.error('Ошибка при разблокировке пользователя');
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: string) => id.substring(0, 8) + '...',
    },
    {
      title: 'Имя пользователя',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? 'Администратор' : 'Пользователь'}
        </Tag>
      ),
    },
    {
      title: 'Telegram ID',
      dataIndex: 'telegramId',
      key: 'telegramId',
      render: (telegramId: string) => telegramId || 'Не привязан',
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Статус',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      render: (isBlocked: boolean) => (
        <Tag color={isBlocked ? 'red' : 'green'}>
          {isBlocked ? 'Заблокирован' : 'Активен'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="middle">
          {record.role !== 'admin' && (
            record.isBlocked ? (
              <Tooltip title="Разблокировать">
                <Button 
                  type="primary" 
                  icon={<UnlockOutlined />} 
                  onClick={() => showUnblockConfirm(record)}
                >
                  Разблокировать
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Заблокировать">
                <Button 
                  type="primary" 
                  danger 
                  icon={<LockOutlined />} 
                  onClick={() => showBlockConfirm(record)}
                >
                  Заблокировать
                </Button>
              </Tooltip>
            )
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Пользователи</Title>
      
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id" 
        loading={loading} 
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Users;
