import { useState, useEffect } from 'react';
import {
  Table, Tag, Space, Button, Typography, DatePicker, Select, Input,
  Form, Card, Row, Col, Drawer, Descriptions, message
} from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { OrderService } from '../services/order.service';
import { Order, OrderStatus } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState<{
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
    shippingAddress?: string;
  }>({});
  const [form] = Form.useForm();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getAll(filters);
      setOrders(data);
    } catch (error) {
      message.error('Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const handleSearch = (values: any) => {
    const newFilters: any = {};

    if (values.status) {
      newFilters.status = values.status;
    }

    if (values.dateRange && values.dateRange.length === 2) {
      newFilters.startDate = values.dateRange[0].format('YYYY-MM-DD');
      newFilters.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }

    if (values.shippingAddress) {
      newFilters.shippingAddress = values.shippingAddress;
    }

    setFilters(newFilters);
  };

  const resetFilters = () => {
    form.resetFields();
    setFilters({});
  };

  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDrawerVisible(true);
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await OrderService.updateStatus(id, status);
      message.success('Статус заказа успешно обновлен');
      fetchOrders();

      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({
          ...selectedOrder,
          status,
        });
      }
    } catch (error) {
      message.error('Ошибка при обновлении статуса заказа');
    }
  };

  const getStatusTag = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { color: string; text: string }> = {
      [OrderStatus.PENDING]: { color: 'gold', text: 'Ожидает обработки' },
      [OrderStatus.PROCESSING]: { color: 'blue', text: 'В обработке' },
      [OrderStatus.SHIPPED]: { color: 'cyan', text: 'Отправлен' },
      [OrderStatus.DELIVERED]: { color: 'green', text: 'Доставлен' },
      [OrderStatus.CANCELLED]: { color: 'red', text: 'Отменен' },
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Номер заказа',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: string) => id.substring(0, 8) + '...',
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Пользователь',
      dataIndex: ['user', 'username'],
      key: 'username',
    },
    {
      title: 'Адрес доставки',
      dataIndex: 'shippingAddress',
      key: 'shippingAddress',
    },
    {
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `${Number(amount).toFixed(2)} ₽`,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => getStatusTag(status),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showOrderDetails(record)}
        >
          Детали
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Заказы</Title>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          initialValues={{ status: undefined, dateRange: undefined, contactInfo: '' }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={24} md={8} lg={6} xl={6}>
              <Form.Item name="status" label="Статус заказа">
                <Select placeholder="Выберите статус" allowClear>
                  <Option value={OrderStatus.PENDING}>Ожидает обработки</Option>
                  <Option value={OrderStatus.PROCESSING}>В обработке</Option>
                  <Option value={OrderStatus.SHIPPED}>Отправлен</Option>
                  <Option value={OrderStatus.DELIVERED}>Доставлен</Option>
                  <Option value={OrderStatus.CANCELLED}>Отменен</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Item name="dateRange" label="Период">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={10} xl={10}>
              <Form.Item name="contactInfo" label="Контактная информация">
                <Input placeholder="Поиск по контактной информации" />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={resetFilters}>Сбросить</Button>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  Поиск
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title="Детали заказа"
        placement="right"
        width={800}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Номер заказа">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="ID заказа">{selectedOrder.id}</Descriptions.Item>
              <Descriptions.Item label="Дата создания">
                {dayjs(selectedOrder.createdAt).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Пользователь">{selectedOrder.user.username}</Descriptions.Item>
              <Descriptions.Item label="Телефон">{selectedOrder.contactPhone}</Descriptions.Item>
              <Descriptions.Item label="Адрес доставки">{selectedOrder.shippingAddress}</Descriptions.Item>
              <Descriptions.Item label="Статус">
                {getStatusTag(selectedOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Общая сумма">
                <strong>{Number(selectedOrder.totalAmount).toFixed(2)} ₽</strong>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24, marginBottom: 24 }}>
              <Title level={4}>Товары в заказе</Title>
              <Table
                dataSource={selectedOrder.orderItems}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Товар',
                    dataIndex: ['product', 'name'],
                    key: 'productName',
                  },
                  {
                    title: 'Цена',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => `${Number(price).toFixed(2)} ₽`,
                  },
                  {
                    title: 'Количество',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: 'Сумма',
                    key: 'total',
                    render: (_, record) => `${(record.price * record.quantity).toFixed(2)} ₽`,
                  },
                ]}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>Изменить статус</Title>
              <Space>
                {Object.values(OrderStatus).map((status) => (
                  <Button
                    key={status}
                    type={selectedOrder.status === status ? 'primary' : 'default'}
                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                    disabled={selectedOrder.status === status}
                  >
                    {status === OrderStatus.PENDING && 'Ожидает обработки'}
                    {status === OrderStatus.PROCESSING && 'В обработке'}
                    {status === OrderStatus.SHIPPED && 'Отправлен'}
                    {status === OrderStatus.DELIVERED && 'Доставлен'}
                    {status === OrderStatus.CANCELLED && 'Отменен'}
                  </Button>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Orders;
