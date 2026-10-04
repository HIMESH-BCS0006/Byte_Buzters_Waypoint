import 'dart:convert';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/auth/auth_controller.dart';
import '../../core/models/enums.dart';
import '../../shared/theme/app_theme.dart';
import '../loader/order_handoff_api.dart';
import 'driver_api.dart';

class OrderQrScannerScreen extends ConsumerStatefulWidget {
  final bool embedded;

  const OrderQrScannerScreen({super.key, this.embedded = false});

  @override
  ConsumerState<OrderQrScannerScreen> createState() =>
      _OrderQrScannerScreenState();
}

class _OrderQrScannerScreenState extends ConsumerState<OrderQrScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _processing = false;
  String? _error;

  Future<void> _handleCode(String? rawValue) async {
    if (_processing || rawValue == null || rawValue.isEmpty) return;

    setState(() {
      _processing = true;
      _error = null;
    });
    await _controller.stop();

    try {
      final auth = ref.read(authControllerProvider);
      final driverId = auth.user?.id ?? auth.user?.username ?? 'driver';
      if (rawValue.startsWith(TripHandoff.qrPrefix)) {
        final tripHandoff = TripHandoff.fromQrPayload(rawValue);
        await ref.read(orderHandoffApiProvider).cacheTripHandoffForTracking(
              handoff: tripHandoff,
              driverId: driverId,
            );
        final savedHandoffs = await ref
            .read(orderHandoffApiProvider)
            .getCachedTripHandoffs(driverId: driverId);
        final handoffToDisplay = savedHandoffs.firstWhere(
          (saved) => saved.tripId == tripHandoff.tripId,
          orElse: () => tripHandoff,
        );
        if (!mounted) return;
        await Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => DriverTripHandoffScreen(handoff: handoffToDisplay),
          ),
        );
        if (mounted) {
          setState(() => _processing = false);
          await _controller.start();
        }
        return;
      }

      final handoff = await ref.read(orderHandoffApiProvider).getOrderByQr(
            qrPayload: rawValue,
            driverId: auth.user?.username ?? auth.user?.id ?? 'driver',
            vehicleId: auth.user?.vehicleId,
          );

      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => DriverOrderDetailScreen(handoff: handoff),
        ),
      );
      if (mounted) {
        setState(() => _processing = false);
        await _controller.start();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _processing = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
      await _controller.start();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar:
          widget.embedded ? null : AppBar(title: const Text('Scan Order QR')),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              final value = capture.barcodes.isEmpty
                  ? null
                  : capture.barcodes.first.rawValue;
              _handleCode(value);
            },
          ),
          Center(
            child: Container(
              width: 270,
              height: 270,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 30,
            child: Column(
              children: [
                if (_error != null)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade700,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    _processing
                        ? 'Reading order...'
                        : 'Point the camera at the loader QR code',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class DriverTripHandoffScreen extends ConsumerStatefulWidget {
  final TripHandoff handoff;

  const DriverTripHandoffScreen({
    super.key,
    required this.handoff,
  });

  @override
  ConsumerState<DriverTripHandoffScreen> createState() =>
      _DriverTripHandoffScreenState();
}

class _DriverTripHandoffScreenState
    extends ConsumerState<DriverTripHandoffScreen> {
  final Set<String> _completedOrderIds = {};
  StreamSubscription<Map<String, dynamic>>? _receiptSubscription;

  String get _driverId {
    final user = ref.read(authControllerProvider).user;
    return user?.id ?? user?.username ?? 'driver';
  }

  @override
  void initState() {
    super.initState();
    _completedOrderIds.addAll(
      widget.handoff.orders
          .where(_hasConfirmedReceipt)
          .map((order) => order.orderId),
    );
    _receiptSubscription =
        ref.read(driverApiProvider).watchReceiptEvents().listen(
      _handleReceiptEvent,
      onError: (Object error) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Receipt updates disconnected: '
              '${error.toString().replaceFirst('Exception: ', '')}',
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _receiptSubscription?.cancel();
    super.dispose();
  }

  Future<void> _handleReceiptEvent(Map<String, dynamic> event) async {
    final completedOrderIds =
        await ref.read(orderHandoffApiProvider).applyReceiptEvent(
              driverId: _driverId,
              event: event,
            );
    final tripOrderIds =
        widget.handoff.orders.map((order) => order.orderId).toSet();
    final matchingOrderIds = completedOrderIds.intersection(tripOrderIds);
    if (matchingOrderIds.isEmpty || !mounted) return;
    setState(() => _completedOrderIds.addAll(matchingOrderIds));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Trip Orders')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryTeal, AppTheme.primaryDark],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trip ${widget.handoff.tripNo} • ${widget.handoff.vehicleId}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '${widget.handoff.depotId} • ${widget.handoff.orders.length} assigned orders',
                  style: const TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 4),
                Text(
                  'Loader: ${widget.handoff.loaderId}',
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          for (final order in widget.handoff.orders)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppTheme.primaryLight,
                          child: Text(
                            '${order.seq}',
                            style: const TextStyle(
                              color: AppTheme.primaryDark,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                order.orderId,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              Text(
                                order.outletName,
                                style: const TextStyle(
                                  color: AppTheme.textSecondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _Row(label: 'Outlet', value: order.outletId),
                    _Row(label: 'District', value: order.district),
                    _Row(label: 'Units', value: '${order.units}'),
                    _Row(
                      label: 'Delivery window',
                      value:
                          '${order.windowOpenTime} - ${order.windowCloseTime}',
                    ),
                    _Row(label: 'ETA', value: order.eta ?? '--'),
                    const SizedBox(height: 12),
                    if (_completedOrderIds.contains(order.orderId) ||
                        _hasConfirmedReceipt(order))
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 11,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.successGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: const Row(
                          children: [
                            Icon(
                              Icons.check_circle,
                              color: AppTheme.successGreen,
                              size: 19,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Order handover complete',
                              style: TextStyle(
                                color: AppTheme.successGreen,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      )
                    else if (order.stopId != null)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () => _showOrderHandoverQr(
                            context,
                            widget.handoff,
                            order,
                          ),
                          icon: const Icon(Icons.qr_code_2),
                          label: const Text('Show QR to Shop Manager'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryDark,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      )
                    else ...[
                      const SizedBox(height: 6),
                      const Text(
                        'This order has no stop ID, so a handover QR cannot be generated.',
                        style: TextStyle(
                          color: AppTheme.errorRed,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _hasConfirmedReceipt(TripHandoffOrder order) =>
      order.receiptStatus == ReceiptStatus.confirmed ||
      order.receiptStatus == ReceiptStatus.discrepancy;

  void _showOrderHandoverQr(
    BuildContext context,
    TripHandoff handoff,
    TripHandoffOrder order,
  ) {
    final payload = 'WAYPOINT-DRIVER-HANDOVER:${jsonEncode({
          'version': 1,
          'type': 'stop_handover',
          'stop_id': order.stopId,
          'trip_id': handoff.tripId,
          'trip_no': handoff.tripNo,
          'vehicle_id': handoff.vehicleId,
          'order_id': order.orderId,
          'sequence': order.seq,
          'outlet_id': order.outletId,
          'outlet_name': order.outletName,
          'district': order.district,
          'ordered_units': order.units,
        })}';

    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => _DriverOrderHandoverQrPage(
          payload: payload,
          title: 'Stop ${order.seq} Handover QR',
          subtitle: '${order.outletName} • ${order.orderId}',
        ),
      ),
    );
  }
}

class _DriverOrderHandoverQrPage extends StatelessWidget {
  final String payload;
  final String title;
  final String subtitle;

  const _DriverOrderHandoverQrPage({
    required this.payload,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Order Handover QR')),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints:
                  BoxConstraints(minHeight: constraints.maxHeight - 40),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            subtitle,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Container(
                            constraints: const BoxConstraints(maxWidth: 300),
                            padding: const EdgeInsets.all(12),
                            color: Colors.white,
                            child: LayoutBuilder(
                              builder: (context, constraints) =>
                                  SizedBox.square(
                                dimension: constraints.maxWidth,
                                child: QrImageView(
                                  data: payload,
                                  version: QrVersions.auto,
                                  backgroundColor: Colors.white,
                                  errorCorrectionLevel: QrErrorCorrectLevel.M,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Show this order-specific code to the shop manager to identify the delivery and stop.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class DriverOrderDetailScreen extends StatelessWidget {
  final OrderHandoff handoff;

  const DriverOrderDetailScreen({super.key, required this.handoff});

  @override
  Widget build(BuildContext context) {
    final order = handoff.order;

    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryTeal, AppTheme.primaryDark],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white, size: 32),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Order received successfully',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(order.orderId,
                      style: const TextStyle(
                          fontSize: 21, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(order.outletName,
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w600)),
                  Text('${order.outletId} • ${order.district}',
                      style: const TextStyle(color: AppTheme.textSecondary)),
                  const Divider(height: 28),
                  _Row(label: 'Sequence', value: '${order.seq}'),
                  _Row(label: 'Units', value: '${order.orderUnits}'),
                  _Row(
                      label: 'Weight',
                      value: '${_number(order.orderWeightKg)} kg'),
                  _Row(
                      label: 'Volume',
                      value: '${_number(order.orderVolumeM3)} m³'),
                  _Row(
                      label: 'Delivery window',
                      value:
                          '${order.windowOpenTime} - ${order.windowCloseTime}'),
                  _Row(label: 'ETA', value: order.eta ?? '--'),
                  _Row(label: 'Loader', value: handoff.loaderId),
                  _Row(label: 'Vehicle', value: handoff.vehicleId ?? '--'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'The loader order was retrieved from the Waypoint API after QR verification.',
            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  static String _number(double value) =>
      value % 1 == 0 ? value.toStringAsFixed(0) : value.toStringAsFixed(2);
}

class _Row extends StatelessWidget {
  final String label;
  final String value;

  const _Row({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
              child: Text(label,
                  style: const TextStyle(color: AppTheme.textSecondary))),
          const SizedBox(width: 12),
          Flexible(
              child: Text(value,
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }
}
