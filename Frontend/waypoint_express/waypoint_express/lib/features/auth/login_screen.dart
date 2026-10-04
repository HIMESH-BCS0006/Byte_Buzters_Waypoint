import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';
import '../../core/config/app_config.dart';
import '../../core/offline/connectivity_service.dart';
import '../../shared/theme/app_theme.dart';
import '../../shared/widgets/mobile_scaffold.dart';

class DemoProfile {
  final String label;
  final String subtitle;
  final String username;
  final String password;
  final IconData icon;
  final Color color;
  final String role;

  const DemoProfile({
    required this.label,
    required this.subtitle,
    required this.username,
    required this.password,
    required this.icon,
    required this.color,
    required this.role,
  });
}

const List<DemoProfile> kDemoProfiles = [
  DemoProfile(
    label: 'Warehouse Loader',
    subtitle: 'Peliyagoda & Kandy Hubs',
    username: 'loader@waypoint.test',
    password: 'pass123',
    icon: Icons.warehouse,
    color: AppTheme.primaryTeal,
    role: 'Loader',
  ),
  DemoProfile(
    label: 'Driver (VEH001 • Peliyagoda)',
    subtitle: 'Truck Reefer • 5.5T capacity',
    username: 'driver@waypoint.test',
    password: 'pass123',
    icon: Icons.local_shipping,
    color: AppTheme.infoBlue,
    role: 'Driver',
  ),
  DemoProfile(
    label: 'Driver (VEH002 • Peliyagoda)',
    subtitle: 'Truck Reefer • 4.0T capacity',
    username: 'driver_VEH002@waypoint.test',
    password: 'pass123',
    icon: Icons.local_shipping,
    color: AppTheme.infoBlue,
    role: 'Driver',
  ),
  DemoProfile(
    label: 'Driver (VEH008 • Peliyagoda)',
    subtitle: 'Truck Ambient • 3.8T capacity',
    username: 'driver_VEH008@waypoint.test',
    password: 'pass123',
    icon: Icons.local_shipping_outlined,
    color: AppTheme.warningAmber,
    role: 'Driver',
  ),
  DemoProfile(
    label: 'Driver (VEH032 • Peliyagoda)',
    subtitle: 'Truck Ambient • 4.2T capacity',
    username: 'driver_VEH032@waypoint.test',
    password: 'pass123',
    icon: Icons.local_shipping_outlined,
    color: AppTheme.warningAmber,
    role: 'Driver',
  ),
  DemoProfile(
    label: 'Driver (VEH035 • Peliyagoda)',
    subtitle: 'Van Reefer • 1.0T capacity',
    username: 'driver_VEH035@waypoint.test',
    password: 'pass123',
    icon: Icons.directions_car,
    color: AppTheme.successGreen,
    role: 'Driver',
  ),
  DemoProfile(
    label: 'Driver (VEH039 • Kandy)',
    subtitle: 'Truck Reefer • 6.2T capacity',
    username: 'driver_VEH039@waypoint.test',
    password: 'pass123',
    icon: Icons.local_shipping,
    color: AppTheme.primaryDark,
    role: 'Driver',
  ),
];

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController(text: AppConfig.devDriverUsername);
  final _passwordController = TextEditingController(text: AppConfig.devPassword);
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _selectProfile(DemoProfile profile, {bool autoLogin = false}) {
    setState(() {
      _usernameController.text = profile.username;
      _passwordController.text = profile.password;
    });

    if (autoLogin) {
      _handleLogin();
    }
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authControllerProvider.notifier).login(
          _usernameController.text,
          _passwordController.text,
        );

    if (success && mounted) {
      final auth = ref.read(authControllerProvider);
      if (auth.isDriver) {
        context.go('/driver');
      } else if (auth.isLoader) {
        context.go('/loader');
      }
    }
  }

  void _showServerConfigDialog() {
    final urlController = TextEditingController(text: AppConfig.activeBaseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('API & Network Config'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Base URL (Mock or Real Backend):',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                hintText: 'e.g. http://localhost:8000/api/v1',
                isDense: true,
              ),
            ),
            const SizedBox(height: 16),
            Consumer(
              builder: (context, ref, _) {
                final net = ref.watch(connectivityServiceProvider);
                return SwitchListTile(
                  title: const Text('Simulate Offline Mode'),
                  subtitle: const Text('Force offline execution for testing/demo'),
                  value: net.isSimulatedOffline,
                  contentPadding: EdgeInsets.zero,
                  onChanged: (val) {
                    ref.read(connectivityServiceProvider.notifier).toggleSimulatedOffline(val);
                  },
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              AppConfig.activeBaseUrl = urlController.text.trim();
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Base URL set to: ${AppConfig.activeBaseUrl}')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return MobileScaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // App Logo & Branding
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryTeal,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryTeal.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.local_shipping,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Waypoint Express',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Driver Delivery & Warehouse Loading',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Error message banner
                  if (authState.errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.errorRed.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppTheme.errorRed.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline,
                              color: AppTheme.errorRed, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              authState.errorMessage!,
                              style: const TextStyle(
                                color: AppTheme.errorRed,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Username field
                  TextFormField(
                    controller: _usernameController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Username / Email',
                      hintText: 'e.g. driver@waypoint.test',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter your username';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),

                  // Password field
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      hintText: '••••••••',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off : Icons.visibility,
                          color: AppTheme.textSecondary,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),

                  // Sign in Button
                  ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleLogin,
                    child: authState.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Sign In'),
                  ),
                  const SizedBox(height: 24),

                  // Demo Accounts Quick Selection Grid
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceVariant,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, size: 16, color: AppTheme.primaryTeal),
                            SizedBox(width: 6),
                            Text(
                              'Demo Accounts (1-Click Login)',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ...kDemoProfiles.map((p) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: InkWell(
                            onTap: authState.isLoading ? null : () => _selectProfile(p, autoLogin: true),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 14,
                                    backgroundColor: p.color.withValues(alpha: 0.15),
                                    child: Icon(p.icon, size: 16, color: p.color),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          p.label,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: AppTheme.textPrimary,
                                          ),
                                        ),
                                        Text(
                                          p.subtitle,
                                          style: const TextStyle(
                                            fontSize: 10.5,
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    Icons.arrow_forward_ios,
                                    size: 12,
                                    color: Colors.grey.shade400,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )),
                        const SizedBox(height: 4),
                        TextButton.icon(
                          onPressed: _showServerConfigDialog,
                          icon: const Icon(Icons.settings, size: 14),
                          label: const Text(
                            'Network Config & Offline Simulation',
                            style: TextStyle(fontSize: 11.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
